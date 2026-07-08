/**
 * EQ Copy — a hidden filter processes pink noise ("Question"). Set your own
 * filter ("Yours") to sound the same, then confirm. Stages progress from
 * high/low-pass (frequency only) to shelves (+gain) to a bell (+Q).
 */

import { useCallback, useRef, useState } from 'react';
import { ABLoopPlayer, pinkNoiseBuffer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { freqAccuracy, linearAccuracy } from '../scoring';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell, ABToggle } from '../GameShell';
import { EqEditor, type EqValue } from '../widgets/EqEditor';
import { getProgress } from '../progress';
import { coach } from '../coaching';

const GAME_ID = 'eq-copy';

interface StageSpec {
  type: BiquadFilterType;
  adjustGain: boolean;
  adjustQ: boolean;
  freqLo: number;
  freqHi: number;
}

function stageSpec(stage: number): StageSpec {
  switch (stage) {
    case 1: return { type: 'highpass', adjustGain: false, adjustQ: false, freqLo: 40, freqHi: 2000 };
    case 2: return { type: 'lowpass', adjustGain: false, adjustQ: false, freqLo: 500, freqHi: 15000 };
    case 3: return { type: 'highpass', adjustGain: false, adjustQ: false, freqLo: 40, freqHi: 2000 };
    case 4: {
      const low = Math.random() < 0.5;
      return low
        ? { type: 'lowshelf', adjustGain: true, adjustQ: false, freqLo: 60, freqHi: 1000 }
        : { type: 'highshelf', adjustGain: true, adjustQ: false, freqLo: 1500, freqHi: 12000 };
    }
    default: return { type: 'peaking', adjustGain: true, adjustQ: true, freqLo: 100, freqHi: 10000 };
  }
}

function levelCfg(level: number) {
  return {
    stages: Math.min(4 + level, 8),
    freqZeroOct: Math.max(2 - (level - 1) * 0.25, 1),
    gainZeroDb: Math.max(12 - (level - 1) * 2, 6),
  };
}

/** Combined accuracy over the adjustable parameters (verified numerically). */
export function eqCopyAccuracy(
  guess: EqValue,
  target: EqValue,
  spec: { adjustGain: boolean; adjustQ: boolean },
  freqZeroOct: number,
  gainZeroDb: number,
): number {
  const parts = [freqAccuracy(guess.freq, target.freq, freqZeroOct)];
  if (spec.adjustGain) parts.push(linearAccuracy(guess.gainDb, target.gainDb, gainZeroDb));
  if (spec.adjustQ) parts.push(freqAccuracy(guess.q, target.q, 2)); // log distance for Q
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

const logUniform = (lo: number, hi: number) => lo * Math.pow(hi / lo, Math.random());

export function EqCopy() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const targetFilterRef = useRef<BiquadFilterNode | null>(null);
  const userFilterRef = useRef<BiquadFilterNode | null>(null);
  const targetRef = useRef<EqValue>({ freq: 1000, gainDb: 0, q: 1 });
  const [spec, setSpec] = useState<StageSpec>(() => stageSpec(1));
  const [value, setValue] = useState<EqValue>({ freq: 632, gainDb: 0, q: 1 });
  const [ab, setAb] = useState(0);
  const [reveal, setReveal] = useState<EqValue | null>(null);

  const ensurePlayer = useCallback((): ABLoopPlayer => {
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(2);
    const ctx = ensureCtx();
    const ft = ctx.createBiquadFilter(); // chain 0: question
    const fu = ctx.createBiquadFilter(); // chain 1: yours
    player.chain(0).input.connect(ft);
    ft.connect(player.chain(0).output);
    player.chain(1).input.connect(fu);
    fu.connect(player.chain(1).output);
    targetFilterRef.current = ft;
    userFilterRef.current = fu;
    playerRef.current = player;
    player.start(pinkNoiseBuffer());
    return player;
  }, []);

  const applyFilter = (f: BiquadFilterNode | null, type: BiquadFilterType, v: EqValue) => {
    if (!f) return;
    f.type = type;
    f.frequency.value = v.freq;
    f.gain.value = v.gainDb;
    f.Q.value = type === 'peaking' ? v.q : 0.7;
  };

  const onStage = useCallback((stage: number) => {
    setReveal(null);
    setTip(null);
    setAb(0);
    const s = stageSpec(stage);
    setSpec(s);
    const target: EqValue = {
      freq: Math.round(logUniform(s.freqLo, s.freqHi)),
      gainDb: s.adjustGain
        ? Math.round((Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 6) * 10) / 10
        : 0,
      q: s.adjustQ ? Math.round(logUniform(0.5, 4) * 10) / 10 : 1,
    };
    targetRef.current = target;
    const start: EqValue = {
      freq: Math.round(Math.sqrt(s.freqLo * s.freqHi)),
      gainDb: 0,
      q: 1,
    };
    setValue(start);
    const p = ensurePlayer();
    applyFilter(targetFilterRef.current, s.type, target);
    applyFilter(userFilterRef.current, s.type, start);
    p.select(0);
  }, [ensurePlayer]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });
  usePlayerTeardown(game.phase, playerRef);

  const changeValue = (v: EqValue) => {
    setValue(v);
    applyFilter(userFilterRef.current, spec.type, v);
  };

  const selectAb = (i: number) => {
    setAb(i);
    playerRef.current?.select(i);
  };

  const confirm = () => {
    if (game.phase !== 'playing') return;
    const acc = eqCopyAccuracy(value, targetRef.current, spec, cfg.freqZeroOct, cfg.gainZeroDb);
    setReveal(targetRef.current);
    const res = game.submit(acc);
    const freqPart = freqAccuracy(value.freq, targetRef.current.freq, cfg.freqZeroOct);
    const gainOk = !spec.adjustGain ||
      linearAccuracy(value.gainDb, targetRef.current.gainDb, cfg.gainZeroDb) > 0.7;
    setTip(coach(GAME_ID, res.missed,
      freqPart < 0.5 && gainOk ? { kind: 'confusion', tag: 'freq-off' } : undefined));
  };

  return (
    <GameShell
      game={game}
      level={level}
      maxLevel={8}
      onLevel={setLevel}
      onStages={setStagesSel}
      refAnchor="ref-eq"
      tip={tip}
      onRepeat={() => playerRef.current?.restart()}
      title="EQ Copy"
      instruction="Set the EQ to recreate the sound"
      accent="#7bbfb7"
      controls={
        <>
          <ABToggle labels={['Question', 'Yours']} active={ab} onSelect={selectAb} />
          <button className="studio-confirm" onClick={confirm} disabled={game.phase !== 'playing'}>
            ✓ Confirm
          </button>
        </>
      }
    >
      <EqEditor
        type={spec.type}
        value={value}
        onChange={changeValue}
        adjustGain={spec.adjustGain}
        adjustQ={spec.adjustQ}
        target={reveal}
      />
      <div className="studio-hint">
        Level {level} · drag the node ({spec.adjustGain ? 'freq + gain' : 'freq'}
        {spec.adjustQ ? ' + Q' : ''}), A/B against the question, confirm
      </div>
    </GameShell>
  );
}
