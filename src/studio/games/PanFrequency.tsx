/**
 * Pan + Frequency — noise plays through a bandpass filter at a hidden
 * frequency, panned to a hidden position. Click the (pan, frequency) point
 * on the 2D plane. Scored on both axes.
 */

import { useCallback, useRef, useState } from 'react';
import { ABLoopPlayer, pinkNoiseBuffer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { freqAccuracy, linearAccuracy, posToFreq, freqToPos, fmtFreq, fmtPan } from '../scoring';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell } from '../GameShell';
import { Plane2D, type PlanePoint } from '../widgets/Plane2D';
import { getProgress } from '../progress';
import { coach } from '../coaching';

const GAME_ID = 'pan-frequency';

function levelCfg(level: number) {
  return {
    stages: Math.min(2 + level, 8),
    panZero: Math.max(0.6 - (level - 1) * 0.1, 0.3),
    freqZeroOct: Math.max(2 - (level - 1) * 0.25, 1),
    freqLo: 100,
    freqHi: 12000,
  };
}

const X_TICKS = [-1, -0.5, 0, 0.5, 1].map((p) => ({
  pos: (p + 1) / 2,
  label: p === 0 ? 'C' : `${Math.abs(p)} ${p < 0 ? 'L' : 'R'}`,
}));
const Y_TICKS = [10000, 3000, 1000, 300, 100].map((hz) => ({
  pos: 1 - freqToPos(hz),
  label: fmtFreq(hz),
}));

/** Plane point ↔ (pan, freq): y = 0 at top = 20 kHz. */
export const pointToPan = (p: PlanePoint) => p.x * 2 - 1;
export const pointToFreq = (p: PlanePoint) => posToFreq(1 - p.y);
export const panFreqToPoint = (pan: number, freq: number): PlanePoint => ({
  x: (pan + 1) / 2,
  y: 1 - freqToPos(freq),
});

export function PanFrequency() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const targetRef = useRef({ pan: 0, freq: 1000 });
  const [reveal, setReveal] = useState<{ yours: PlanePoint; correct: PlanePoint } | null>(null);

  const ensurePlayer = useCallback((): ABLoopPlayer => {
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(1, 0.3);
    const ctx = ensureCtx();
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 3;
    const boost = ctx.createGain();
    boost.gain.value = 2.5; // compensate narrow-band energy loss
    const pan = ctx.createStereoPanner();
    player.chain(0).input.connect(f);
    f.connect(boost);
    boost.connect(pan);
    pan.connect(player.chain(0).output);
    filterRef.current = f;
    pannerRef.current = pan;
    playerRef.current = player;
    player.start(pinkNoiseBuffer());
    return player;
  }, []);

  const onStage = useCallback(() => {
    setReveal(null);
    setTip(null);
    ensurePlayer();
    const freq = Math.round(cfg.freqLo * Math.pow(cfg.freqHi / cfg.freqLo, Math.random()));
    const pan = Math.round((Math.random() * 1.8 - 0.9) * 100) / 100;
    targetRef.current = { pan, freq };
    if (filterRef.current) filterRef.current.frequency.value = freq;
    if (pannerRef.current) pannerRef.current.pan.value = pan;
  }, [cfg.freqLo, cfg.freqHi, ensurePlayer]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });
  usePlayerTeardown(game.phase, playerRef);

  const handleAnswer = (p: PlanePoint) => {
    if (game.phase !== 'playing') return;
    const t = targetRef.current;
    const acc =
      (linearAccuracy(pointToPan(p), t.pan, cfg.panZero) +
        freqAccuracy(pointToFreq(p), t.freq, cfg.freqZeroOct)) / 2;
    setReveal({ yours: p, correct: panFreqToPoint(t.pan, t.freq) });
    const res = game.submit(acc);
    setTip(coach(GAME_ID, res.missed, {
      kind: 'direction', axis: 'pan', sign: pointToPan(p) < t.pan ? -1 : 1,
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
      title="Pan + Frequency"
      instruction="Find the pan position and the frequency"
      accent="#5d6a85"
    >
      <Plane2D
        format={(p) => `${fmtPan(pointToPan(p))} · ${fmtFreq(pointToFreq(p))}`}
        onAnswer={handleAnswer}
        reveal={reveal}
        xTicks={X_TICKS}
        yTicks={Y_TICKS}
      />
      <div className="studio-hint">Level {level} · x = pan, y = frequency · headphones</div>
    </GameShell>
  );
}
