/**
 * Compression — two playable panels; one runs the drum loop through a
 * hard compressor (fast attack/release for obvious pumping). Find it.
 */

import { useCallback, useRef, useState } from 'react';
import { ABLoopPlayer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { drumLoop } from '../loops';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell } from '../GameShell';
import { ChoicePanels } from '../widgets/ChoicePanels';
import { getProgress } from '../progress';

const GAME_ID = 'compression';

function levelCfg(level: number) {
  return {
    stages: 12,
    threshold: -40 + Math.min((level - 1) * 5, 20), // higher level ⇒ subtler squash
  };
}

export function Compression() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const compsRef = useRef<[DynamicsCompressorNode, DynamicsCompressorNode] | null>(null);
  const makeupsRef = useRef<[GainNode, GainNode] | null>(null);
  const correctRef = useRef(0);
  const [activePlay, setActivePlay] = useState(0);
  const [reveal, setReveal] = useState<{ correct: number; yours: number } | null>(null);

  const ensurePlayer = useCallback(async (): Promise<ABLoopPlayer> => {
    if (playerRef.current) return playerRef.current;
    const buf = await drumLoop();
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(2);
    const ctx = ensureCtx();
    const comps: DynamicsCompressorNode[] = [];
    const makeups: GainNode[] = [];
    for (let i = 0; i < 2; i++) {
      const c = ctx.createDynamicsCompressor();
      const m = ctx.createGain();
      player.chain(i).input.connect(c);
      c.connect(m);
      m.connect(player.chain(i).output);
      comps.push(c);
      makeups.push(m);
    }
    compsRef.current = comps as [DynamicsCompressorNode, DynamicsCompressorNode];
    makeupsRef.current = makeups as [GainNode, GainNode];
    playerRef.current = player;
    player.start(buf);
    return player;
  }, []);

  const onStage = useCallback(() => {
    setReveal(null);
    const squashed = Math.random() < 0.5 ? 0 : 1;
    correctRef.current = squashed;
    void ensurePlayer().then((p) => {
      const comps = compsRef.current!;
      const makeups = makeupsRef.current!;
      for (let i = 0; i < 2; i++) {
        const c = comps[i];
        if (i === squashed) {
          c.threshold.value = cfg.threshold;
          c.ratio.value = 12;
          c.attack.value = 0.003;
          c.release.value = 0.08;
          c.knee.value = 4;
          makeups[i].gain.value = Math.pow(10, (-cfg.threshold * 0.35) / 20);
        } else {
          c.threshold.value = 0; // no compression
          c.ratio.value = 1;
          makeups[i].gain.value = 1;
        }
      }
      p.select(0);
      setActivePlay(0);
    });
  }, [cfg.threshold, ensurePlayer]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });
  usePlayerTeardown(game.phase, playerRef);

  const play = (i: number) => {
    setActivePlay(i);
    playerRef.current?.select(i);
  };

  const answer = (i: number) => {
    if (game.phase !== 'playing') return;
    setReveal({ correct: correctRef.current, yours: i });
    game.submit(i === correctRef.current ? 1 : 0);
  };

  return (
    <GameShell
      game={game}
      level={level}
      maxLevel={8}
      onLevel={setLevel}
      onStages={setStagesSel}
      title="Compression"
      instruction="Pick the more compressed sound"
      accent="#7fa86f"
    >
      <ChoicePanels
        labels={['SELECT', 'SELECT']}
        playable
        activePlay={activePlay}
        onPlay={play}
        onSelect={answer}
        reveal={reveal}
      />
      <div className="studio-hint">Level {level} · listen for pumping and squashed transients</div>
    </GameShell>
  );
}
