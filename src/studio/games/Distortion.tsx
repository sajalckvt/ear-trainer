/**
 * Distortion — two playable panels; one has extra saturation on the
 * synth loop. Audition both, select the distorted one.
 */

import { useCallback, useRef, useState } from 'react';
import { ABLoopPlayer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { stageLoop } from '../loops';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell } from '../GameShell';
import { ChoicePanels } from '../widgets/ChoicePanels';
import { getProgress } from '../progress';
import { coach } from '../coaching';

const GAME_ID = 'distortion';

function levelCfg(level: number) {
  return {
    stages: 12,
    drive: Math.max(30 - (level - 1) * 6, 8),
  };
}

function shaperCurve(k: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const c = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return c;
}

const IDENTITY = shaperCurve(0);

export function Distortion() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const shapersRef = useRef<[WaveShaperNode, WaveShaperNode] | null>(null);
  const trimsRef = useRef<[GainNode, GainNode] | null>(null);
  const correctRef = useRef(0);
  const [activePlay, setActivePlay] = useState(0);
  const [reveal, setReveal] = useState<{ correct: number; yours: number } | null>(null);

  const ensurePlayer = useCallback((): ABLoopPlayer => {
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(2);
    const ctx = ensureCtx();
    const shapers: WaveShaperNode[] = [];
    const trims: GainNode[] = [];
    for (let i = 0; i < 2; i++) {
      const s = ctx.createWaveShaper();
      const t = ctx.createGain();
      player.chain(i).input.connect(s);
      s.connect(t);
      t.connect(player.chain(i).output);
      shapers.push(s);
      trims.push(t);
    }
    shapersRef.current = shapers as [WaveShaperNode, WaveShaperNode];
    trimsRef.current = trims as [GainNode, GainNode];
    playerRef.current = player;
    return player;
  }, []);

  const onStage = useCallback((stage: number) => {
    setReveal(null);
    setTip(null);
    const distorted = Math.random() < 0.5 ? 0 : 1;
    correctRef.current = distorted;
    const p = ensurePlayer();
    void stageLoop(stage).then((buf) => {
      p.setBuffer(buf);
      const shapers = shapersRef.current!;
      const trims = trimsRef.current!;
      for (let i = 0; i < 2; i++) {
        const isDist = i === distorted;
        shapers[i].curve = isDist ? shaperCurve(cfg.drive) : IDENTITY;
        trims[i].gain.value = isDist ? 1 / (1 + cfg.drive / 40) : 1;
      }
      p.select(0);
      setActivePlay(0);
    });
  }, [cfg.drive, ensurePlayer]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });
  usePlayerTeardown(game.phase, playerRef);

  const play = (i: number) => {
    setActivePlay(i);
    playerRef.current?.select(i);
  };

  const answer = (i: number) => {
    if (game.phase !== 'playing') return;
    setReveal({ correct: correctRef.current, yours: i });
    const res = game.submit(i === correctRef.current ? 1 : 0);
    setTip(coach(GAME_ID, res.missed, { kind: 'wrong' }));
  };

  return (
    <GameShell
      game={game}
      level={level}
      maxLevel={8}
      onLevel={setLevel}
      onStages={setStagesSel}
      refAnchor="ref-synthesis"
      tip={tip}
      onRepeat={() => playerRef.current?.restart()}
      title="Distortion"
      instruction="Pick the more distorted sound"
      accent="#c0524d"
    >
      <ChoicePanels
        labels={['SELECT', 'SELECT']}
        playable
        activePlay={activePlay}
        onPlay={play}
        onSelect={answer}
        reveal={reveal}
      />
      <div className="studio-hint">Level {level} · audition both, select the distorted one</div>
    </GameShell>
  );
}
