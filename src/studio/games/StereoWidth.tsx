/**
 * StereoWidth — decorrelated stereo noise is played through a mid/side width
 * matrix at a hidden width. Click the mirrored ruler where you hear the edges.
 *
 * Width w: out L = M + w·S, out R = M − w·S (w = 0 mono … 1 full width).
 */

import { useCallback, useRef, useState } from 'react';
import { ABLoopPlayer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { stereoPinkBuffer } from '../loops';
import { linearAccuracy } from '../scoring';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell } from '../GameShell';
import { Ruler, type RulerTick } from '../widgets/Ruler';
import { getProgress } from '../progress';

const GAME_ID = 'stereo-width';

function levelCfg(level: number) {
  return {
    stages: Math.min(2 + level, 8),
    zeroAtDistance: Math.max(0.45 - (level - 1) * 0.05, 0.2),
  };
}

// Mirrored width labels: 0.9 … 0.1, 0, 0.1 … 0.9
const TICKS: RulerTick[] = [-0.9, -0.7, -0.5, -0.3, -0.1, 0, 0.1, 0.3, 0.5, 0.7, 0.9]
  .map((p) => ({ pos: (p + 1) / 2, label: `${Math.abs(p)}` }));

const posToWidth = (pos: number) => Math.min(0.98, Math.abs(pos * 2 - 1));

export function StereoWidth() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const sideGainsRef = useRef<[GainNode, GainNode] | null>(null);
  const targetRef = useRef(0.5);
  const [reveal, setReveal] = useState<{ yours: number; correct: number } | null>(null);

  const ensurePlayer = useCallback((): ABLoopPlayer => {
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(1, 0.25);
    const ctx = ensureCtx();
    const { input, output } = player.chain(0);

    // M/S width matrix
    const split = ctx.createChannelSplitter(2);
    const merge = ctx.createChannelMerger(2);
    input.connect(split);

    const mid = ctx.createGain();   // M = 0.5L + 0.5R
    const side = ctx.createGain();  // S = 0.5L − 0.5R
    const l2m = ctx.createGain(); l2m.gain.value = 0.5;
    const r2m = ctx.createGain(); r2m.gain.value = 0.5;
    const l2s = ctx.createGain(); l2s.gain.value = 0.5;
    const r2s = ctx.createGain(); r2s.gain.value = -0.5;
    split.connect(l2m, 0); split.connect(r2m, 1);
    split.connect(l2s, 0); split.connect(r2s, 1);
    l2m.connect(mid); r2m.connect(mid);
    l2s.connect(side); r2s.connect(side);

    const sideL = ctx.createGain(); // +w
    const sideR = ctx.createGain(); // −w
    mid.connect(merge, 0, 0);
    mid.connect(merge, 0, 1);
    side.connect(sideL); sideL.connect(merge, 0, 0);
    side.connect(sideR); sideR.connect(merge, 0, 1);
    merge.connect(output);

    sideGainsRef.current = [sideL, sideR];
    playerRef.current = player;
    player.start(stereoPinkBuffer(ctx));
    return player;
  }, []);

  const setWidth = (w: number) => {
    const g = sideGainsRef.current;
    if (g) { g[0].gain.value = w; g[1].gain.value = -w; }
  };

  const onStage = useCallback(() => {
    setReveal(null);
    ensurePlayer();
    const w = Math.round((0.1 + Math.random() * 0.85) * 100) / 100;
    targetRef.current = w;
    setWidth(w);
  }, [ensurePlayer]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });
  usePlayerTeardown(game.phase, playerRef);

  const handleAnswer = (pos: number) => {
    if (game.phase !== 'playing') return;
    const guess = posToWidth(pos);
    const acc = linearAccuracy(guess, targetRef.current, cfg.zeroAtDistance);
    // Show the correct width on the same side the user clicked
    const side = pos >= 0.5 ? 1 : -1;
    setReveal({ yours: pos, correct: 0.5 + (side * targetRef.current) / 2 });
    game.submit(acc);
  };

  return (
    <GameShell
      game={game}
      level={level}
      maxLevel={8}
      onLevel={setLevel}
      onStages={setStagesSel}
      title="Stereo Width"
      instruction="Estimate the stereo width"
      accent="#3f7d6d"
    >
      <div className="studio-lr-row"><span>‹ LEFT</span><span>RIGHT ›</span></div>
      <Ruler
        ticks={TICKS}
        format={(pos) => `${posToWidth(pos).toFixed(2)}`}
        onAnswer={handleAnswer}
        reveal={reveal}
      />
      <div className="studio-hint">Level {level} · click how far out the edges sit · headphones</div>
    </GameShell>
  );
}
