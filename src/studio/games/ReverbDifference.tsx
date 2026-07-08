/**
 * Reverb Difference — three playable panels; two share the same reverb, one has
 * different settings (longer tail, wetter). Find the odd one out.
 */

import { useCallback, useRef, useState } from 'react';
import { ABLoopPlayer, makeImpulse } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { stageLoop } from '../loops';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell } from '../GameShell';
import { ChoicePanels } from '../widgets/ChoicePanels';
import { getProgress } from '../progress';
import { coach } from '../coaching';

const GAME_ID = 'reverb-difference';

function levelCfg(level: number) {
  return {
    stages: 12,
    baseDecay: 1.0,
    baseWet: 0.35,
    oddFactor: Math.max(2.2 - (level - 1) * 0.3, 1.3), // decay multiplier for the odd one
  };
}

export function ReverbDifference() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const convsRef = useRef<ConvolverNode[]>([]);
  const wetsRef = useRef<GainNode[]>([]);
  const correctRef = useRef(0);
  const [activePlay, setActivePlay] = useState(0);
  const [reveal, setReveal] = useState<{ correct: number; yours: number } | null>(null);

  const ensurePlayer = useCallback((): ABLoopPlayer => {
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(3);
    const ctx = ensureCtx();
    const convs: ConvolverNode[] = [];
    const wets: GainNode[] = [];
    for (let i = 0; i < 3; i++) {
      const { input, output } = player.chain(i);
      input.connect(output); // dry
      const cv = ctx.createConvolver();
      const wet = ctx.createGain();
      input.connect(cv);
      cv.connect(wet);
      wet.connect(output);
      convs.push(cv);
      wets.push(wet);
    }
    convsRef.current = convs;
    wetsRef.current = wets;
    playerRef.current = player;
    return player;
  }, []);

  const onStage = useCallback((stage: number) => {
    setReveal(null);
    setTip(null);
    const odd = Math.floor(Math.random() * 3);
    correctRef.current = odd;
    const p = ensurePlayer();
    void stageLoop(stage).then((buf) => {
      p.setBuffer(buf);
      const baseIR = makeImpulse(cfg.baseDecay);
      const oddIR = makeImpulse(cfg.baseDecay * cfg.oddFactor);
      for (let i = 0; i < 3; i++) {
        convsRef.current[i].buffer = i === odd ? oddIR : baseIR;
        wetsRef.current[i].gain.value = i === odd ? cfg.baseWet + 0.15 : cfg.baseWet;
      }
      p.select(0);
      setActivePlay(0);
    });
  }, [cfg.baseDecay, cfg.baseWet, cfg.oddFactor, ensurePlayer]);

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
      refAnchor="ref-space"
      tip={tip}
      onRepeat={() => playerRef.current?.restart()}
      title="Reverb Difference"
      instruction="Pick the sound with different reverb"
      accent="#68b0a8"
    >
      <ChoicePanels
        labels={['SELECT', 'SELECT', 'SELECT']}
        playable
        activePlay={activePlay}
        onPlay={play}
        onSelect={answer}
        reveal={reveal}
      />
      <div className="studio-hint">Level {level} · two match, one stands out — find it</div>
    </GameShell>
  );
}
