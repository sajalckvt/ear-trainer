/**
 * Mix Balance — four stems (kick / snare / hats / bass) play at hidden
 * levels ("Question"). Set your faders ("Yours") to recreate the balance,
 * then confirm. Scored per stem in dB.
 */

import { useCallback, useRef, useState } from 'react';
import { ABLoopPlayer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { stemLoops, stemSetForLevel, stemSetNames } from '../loops';
import { linearAccuracy } from '../scoring';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell, ABToggle } from '../GameShell';
import { getProgress } from '../progress';
import { coach } from '../coaching';

const GAME_ID = 'mix-balance';

const N = 4;
const FADER_MIN = -18;
// Faders start all the way down: an untouched board must score a miss
// (verified numerically), so you have to build the mix up by ear.
const START_DB = FADER_MIN;

function levelCfg(level: number) {
  return {
    stages: Math.min(3 + level, 8),
    zeroAtDb: Math.max(6 - (level - 1) * 0.5, 3),
  };
}

/** Mean per-stem accuracy in dB (verified numerically). */
export function mixAccuracy(userDb: number[], targetDb: number[], zeroAtDb: number): number {
  let sum = 0;
  for (let i = 0; i < userDb.length; i++) sum += linearAccuracy(userDb[i], targetDb[i], zeroAtDb);
  return sum / userDb.length;
}

const dbToGain = (db: number) => Math.pow(10, db / 20);
const round5 = (x: number) => Math.round(x * 2) / 2;

export function MixBalance() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const cfg = levelCfg(level);
  const setIdx = stemSetForLevel(level);
  const stemNames = stemSetNames(setIdx);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const builtSetRef = useRef(-1);
  const qGainsRef = useRef<GainNode[]>([]);
  const uGainsRef = useRef<GainNode[]>([]);
  const targetRef = useRef<number[]>(Array(N).fill(-6));
  const [faders, setFaders] = useState<number[]>(Array(N).fill(START_DB));
  const [ab, setAb] = useState(0);
  const [reveal, setReveal] = useState<number[] | null>(null);

  const ensurePlayer = useCallback(async (): Promise<ABLoopPlayer> => {
    // Level bands use different stem sets — rebuild if the set changed.
    if (playerRef.current && builtSetRef.current !== setIdx) {
      playerRef.current.stop();
      playerRef.current = null;
    }
    if (playerRef.current) return playerRef.current;
    const stems = await stemLoops(setIdx);
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(2, 0.3);
    player.passthrough(0);
    player.passthrough(1);
    const ctx = ensureCtx();
    const srcs = player.startSources(stems);
    const qGains: GainNode[] = [];
    const uGains: GainNode[] = [];
    srcs.forEach((src) => {
      const qg = ctx.createGain();
      const ug = ctx.createGain();
      src.connect(qg);
      src.connect(ug);
      qg.connect(player.chain(0).input);
      ug.connect(player.chain(1).input);
      qGains.push(qg);
      uGains.push(ug);
    });
    qGainsRef.current = qGains;
    uGainsRef.current = uGains;
    playerRef.current = player;
    builtSetRef.current = setIdx;
    return player;
  }, [setIdx]);

  const onStage = useCallback(() => {
    setReveal(null);
    setTip(null);
    setAb(0);
    const target = Array.from({ length: N }, () => round5(-15 + Math.random() * 15));
    targetRef.current = target;
    setFaders(Array(N).fill(START_DB));
    void ensurePlayer().then((p) => {
      target.forEach((db, i) => { qGainsRef.current[i].gain.value = dbToGain(db); });
      uGainsRef.current.forEach((g) => { g.gain.value = dbToGain(START_DB); });
      p.select(0);
    });
  }, [ensurePlayer]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });
  usePlayerTeardown(game.phase, playerRef);

  const setFader = (i: number, db: number) => {
    setFaders((f) => {
      const next = [...f];
      next[i] = db;
      return next;
    });
    const g = uGainsRef.current[i];
    if (g) g.gain.value = dbToGain(db);
  };

  const selectAb = (i: number) => {
    setAb(i);
    playerRef.current?.select(i);
  };

  const confirm = () => {
    if (game.phase !== 'playing') return;
    setReveal(targetRef.current);
    const res = game.submit(mixAccuracy(faders, targetRef.current, cfg.zeroAtDb));
    let wi = 0;
    faders.forEach((f, i) => {
      if (Math.abs(f - targetRef.current[i]) > Math.abs(faders[wi] - targetRef.current[wi])) wi = i;
    });
    setTip(coach(GAME_ID, res.missed, {
      kind: 'confusion',
      tag: `stem:${stemNames[wi]}:${faders[wi] > targetRef.current[wi] ? 'high' : 'low'}`,
    }));
  };

  return (
    <GameShell
      game={game}
      level={level}
      maxLevel={8}
      onLevel={setLevel}
      onStages={setStagesSel}
      refAnchor="ref-dynamics"
      tip={tip}
      title="Mix Balance"
      instruction="Recreate the balance of the four stems"
      accent="#b3906f"
      controls={
        <>
          <ABToggle labels={['Question', 'Yours']} active={ab} onSelect={selectAb} />
          <button className="studio-confirm" onClick={confirm} disabled={game.phase !== 'playing'}>
            ✓ Confirm
          </button>
        </>
      }
    >
      <div className="mix-faders">
        {stemNames.map((name, i) => (
          <div className="mix-fader" key={name}>
            <input
              className="comp-makeup"
              type="range"
              min={FADER_MIN}
              max={0}
              step={0.5}
              value={faders[i]}
              disabled={!!reveal}
              onChange={(e) => setFader(i, Number(e.target.value))}
            />
            <div className="mix-fader-db">{faders[i]} dB</div>
            {reveal && <div className="mix-fader-target">{reveal[i]} dB</div>}
            <div className="comp-col-label">{name}</div>
          </div>
        ))}
      </div>
      <div className="studio-hint">
        Level {level} · A/B against the question mix, match each fader, confirm
      </div>
    </GameShell>
  );
}
