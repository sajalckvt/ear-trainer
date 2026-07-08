/**
 * EQ Boost — a bell (peaking) EQ boosts (or, at higher levels, cuts) a hidden
 * frequency in a pink-noise loop, with varying Q. Toggle the EQ on/off to
 * compare, then click the frequency on a log ruler (20 Hz – 20 kHz).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ABLoopPlayer, pinkNoiseBuffer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { freqAccuracy, freqToPos, posToFreq, fmtFreq } from '../scoring';
import { useStageGame } from '../useStageGame';
import { GameShell, ABToggle } from '../GameShell';
import { Ruler, type RulerTick } from '../widgets/Ruler';
import { getProgress } from '../progress';
import { coach } from '../coaching';

const GAME_ID = 'eq-boost';

interface LevelCfg {
  stages: number;
  gainDb: number;
  /** Qs the stage may draw (higher level ⇒ wider variety). */
  qChoices: number[];
  /** L5+ also hides CUTS, not just boosts — much harder to hear. */
  allowCut: boolean;
  freqLo: number;
  freqHi: number;
  zeroAtOctaves: number;
}

/** Higher level ⇒ gentler gain, varied Q, cuts, tighter tolerance. */
function levelCfg(level: number): LevelCfg {
  return {
    stages: Math.min(3 + level, 8),
    gainDb: Math.max(12 - (level - 1) * 2, 4),
    qChoices: level >= 3 ? [0.7, 2, 4] : [2],
    allowCut: level >= 5,
    freqLo: level >= 3 ? 60 : 200,
    freqHi: level >= 3 ? 14000 : 8000,
    zeroAtOctaves: Math.max(2 - (level - 1) * 0.25, 1),
  };
}

const TICKS: RulerTick[] = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
  .map((hz) => ({ pos: freqToPos(hz), label: fmtFreq(hz) }));

export function EqBoost() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const targetRef = useRef(1000);
  const [ab, setAb] = useState(1); // 0 = EQ off, 1 = EQ on
  const [stageDesc, setStageDesc] = useState('');
  const [reveal, setReveal] = useState<{ yours: number; correct: number } | null>(null);

  const newTarget = useCallback(() => {
    // Log-uniform frequency; per-stage Q and boost-or-cut
    const hz = cfg.freqLo * Math.pow(cfg.freqHi / cfg.freqLo, Math.random());
    const q = cfg.qChoices[Math.floor(Math.random() * cfg.qChoices.length)];
    const cut = cfg.allowCut && Math.random() < 0.4;
    const gain = cut ? -cfg.gainDb : cfg.gainDb;
    targetRef.current = hz;
    const f = filterRef.current;
    if (f) {
      f.frequency.value = hz;
      f.Q.value = q;
      f.gain.value = gain;
    }
    setStageDesc(`${cut ? '−' : '+'}${cfg.gainDb} dB bell · Q ${q}`);
  }, [cfg.freqLo, cfg.freqHi, cfg.qChoices, cfg.allowCut, cfg.gainDb]);

  const onStage = useCallback(() => {
    setReveal(null);
    setTip(null);
    // Build the player lazily inside the user gesture (audio unlock).
    if (!playerRef.current) {
      const player = new ABLoopPlayer(2);
      player.passthrough(0); // chain 0: original
      const ctx = ensureCtx();
      const f = ctx.createBiquadFilter(); // chain 1: processed
      f.type = 'peaking';
      player.chain(1).input.connect(f);
      f.connect(player.chain(1).output);
      filterRef.current = f;
      playerRef.current = player;
      player.start(pinkNoiseBuffer());
      player.select(1);
      setAb(1);
    }
    newTarget();
  }, [newTarget]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });

  // Tear down audio when the run ends or the component unmounts.
  useEffect(() => {
    if (game.phase === 'complete' || game.phase === 'intro') {
      playerRef.current?.stop();
      playerRef.current = null;
      filterRef.current = null;
    }
  }, [game.phase]);
  useEffect(() => () => { playerRef.current?.stop(); playerRef.current = null; }, []);

  const selectAb = (i: number) => {
    setAb(i);
    playerRef.current?.select(i);
  };

  const handleAnswer = (pos: number) => {
    if (game.phase !== 'playing') return;
    const guessHz = posToFreq(pos);
    const acc = freqAccuracy(guessHz, targetRef.current, cfg.zeroAtOctaves);
    setReveal({ yours: pos, correct: freqToPos(targetRef.current) });
    const res = game.submit(acc);
    setTip(coach(GAME_ID, res.missed, {
      kind: 'direction', axis: 'freq', sign: guessHz < targetRef.current ? -1 : 1,
    }));
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
      title="EQ Boost"
      instruction="Find the boosted (or cut) frequency"
      accent="#8fc7bf"
      controls={
        <ABToggle labels={['EQ Off', 'EQ On']} active={ab} onSelect={selectAb} />
      }
    >
      <Ruler
        ticks={TICKS}
        format={(pos) => fmtFreq(posToFreq(pos))}
        onAnswer={handleAnswer}
        reveal={reveal}
      />
      <div className="studio-hint">Level {level} · {stageDesc} · toggle the EQ and find it</div>
    </GameShell>
  );
}
