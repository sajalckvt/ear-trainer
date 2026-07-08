/**
 * PanPosition — a pink-noise loop is panned to a hidden stereo position.
 * Click where you hear it on the L↔R ruler. Use headphones!
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ABLoopPlayer, pinkNoiseBuffer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { linearAccuracy, fmtPan } from '../scoring';
import { useStageGame } from '../useStageGame';
import { GameShell } from '../GameShell';
import { Ruler, type RulerTick } from '../widgets/Ruler';
import { getProgress } from '../progress';
import { coach } from '../coaching';

const GAME_ID = 'pan-position';

interface LevelCfg {
  stages: number;
  zeroAtDistance: number; // pan units (full scale is -1..1)
}

function levelCfg(level: number): LevelCfg {
  return {
    stages: Math.min(2 + level, 8),
    zeroAtDistance: Math.max(0.6 - (level - 1) * 0.1, 0.25),
  };
}

// Mirrored labels like SoundGym: 0.9 … 0.1, 0, 0.1 … 0.9
const TICKS: RulerTick[] = [-0.9, -0.7, -0.5, -0.3, -0.1, 0, 0.1, 0.3, 0.5, 0.7, 0.9]
  .map((p) => ({ pos: (p + 1) / 2, label: `${Math.abs(p)}` }));

const posToPan = (pos: number) => pos * 2 - 1;
const panToPos = (pan: number) => (pan + 1) / 2;

export function PanPosition() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const pannerRef = useRef<StereoPannerNode | null>(null);
  const targetRef = useRef(0);
  const [reveal, setReveal] = useState<{ yours: number; correct: number } | null>(null);

  const newTarget = useCallback(() => {
    // Uniform in [-0.95, 0.95]
    const pan = Math.round((Math.random() * 1.9 - 0.95) * 100) / 100;
    targetRef.current = pan;
    if (pannerRef.current) pannerRef.current.pan.value = pan;
  }, []);

  const onStage = useCallback(() => {
    setReveal(null);
    setTip(null);
    if (!playerRef.current) {
      const player = new ABLoopPlayer(1, 0.18);
      const ctx = ensureCtx();
      const panner = ctx.createStereoPanner();
      player.chain(0).input.connect(panner);
      panner.connect(player.chain(0).output);
      pannerRef.current = panner;
      playerRef.current = player;
      player.start(pinkNoiseBuffer());
    }
    newTarget();
  }, [newTarget]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });

  useEffect(() => {
    if (game.phase === 'complete' || game.phase === 'intro') {
      playerRef.current?.stop();
      playerRef.current = null;
      pannerRef.current = null;
    }
  }, [game.phase]);
  useEffect(() => () => { playerRef.current?.stop(); playerRef.current = null; }, []);

  const handleAnswer = (pos: number) => {
    if (game.phase !== 'playing') return;
    const guess = posToPan(pos);
    const acc = linearAccuracy(guess, targetRef.current, cfg.zeroAtDistance);
    setReveal({ yours: pos, correct: panToPos(targetRef.current) });
    const res = game.submit(acc);
    setTip(coach(GAME_ID, res.missed, {
      kind: 'direction', axis: 'pan', sign: guess < targetRef.current ? -1 : 1,
    }));
  };

  return (
    <GameShell
      game={game}
      level={level}
      maxLevel={8}
      onLevel={setLevel}
      onStages={setStagesSel}
      refAnchor="ref-space"
      tip={tip}
      onRepeat={() => playerRef.current?.restart()}
      title="Pan Position"
      instruction="Where is the sound panned?"
      accent="#a3c293"
    >
      <div className="studio-lr-row"><span>‹ LEFT</span><span>RIGHT ›</span></div>
      <Ruler
        ticks={TICKS}
        format={(pos) => fmtPan(posToPan(pos))}
        onAnswer={handleAnswer}
        reveal={reveal}
      />
      <div className="studio-hint">Level {level} · headphones recommended</div>
    </GameShell>
  );
}
