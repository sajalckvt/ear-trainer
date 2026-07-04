/**
 * EQ Match — an EQ curve is displayed; two playable sounds, only one was
 * processed with those exact settings. Pick the match.
 */

import { useCallback, useRef, useState } from 'react';
import { ABLoopPlayer, pinkNoiseBuffer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell } from '../GameShell';
import { ChoicePanels } from '../widgets/ChoicePanels';
import { EqCurve } from '../widgets/EqCurve';
import { getProgress } from '../progress';

const GAME_ID = 'eq-match';

function levelCfg(level: number) {
  return {
    stages: 12,
    gainDb: 9,
    q: 1.4,
    /** L1: the imposter is flat. L2+: imposter is the same boost at a wrong
     * frequency, at least this many octaves away (shrinks per level). */
    imposterMinOct: level === 1 ? Infinity : Math.max(2.25 - level * 0.25, 0.75),
    allowCut: level >= 2,
  };
}

const randFreq = () => 150 * Math.pow(8000 / 150, Math.random());

export function EqMatch() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const filtersRef = useRef<[BiquadFilterNode, BiquadFilterNode] | null>(null);
  const correctRef = useRef(0);
  const [shown, setShown] = useState<{ freq: number; gainDb: number } | null>(null);
  const [activePlay, setActivePlay] = useState(0);
  const [reveal, setReveal] = useState<{ correct: number; yours: number } | null>(null);

  const ensurePlayer = useCallback((): ABLoopPlayer => {
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(2);
    const ctx = ensureCtx();
    const filters: BiquadFilterNode[] = [];
    for (let i = 0; i < 2; i++) {
      const f = ctx.createBiquadFilter();
      f.type = 'peaking';
      player.chain(i).input.connect(f);
      f.connect(player.chain(i).output);
      filters.push(f);
    }
    filtersRef.current = filters as [BiquadFilterNode, BiquadFilterNode];
    playerRef.current = player;
    player.start(pinkNoiseBuffer());
    return player;
  }, []);

  const onStage = useCallback(() => {
    setReveal(null);
    const freq = randFreq();
    const gainDb = cfg.allowCut && Math.random() < 0.4 ? -cfg.gainDb : cfg.gainDb;
    const match = Math.random() < 0.5 ? 0 : 1;
    correctRef.current = match;
    setShown({ freq, gainDb });

    const p = ensurePlayer();
    const filters = filtersRef.current!;
    // Imposter: flat at L1, wrong-frequency same-shape boost at L2+
    let imposterFreq = freq;
    if (cfg.imposterMinOct !== Infinity) {
      do { imposterFreq = randFreq(); }
      while (Math.abs(Math.log2(imposterFreq / freq)) < cfg.imposterMinOct);
    }
    for (let i = 0; i < 2; i++) {
      const f = filters[i];
      f.Q.value = cfg.q;
      if (i === match) {
        f.frequency.value = freq;
        f.gain.value = gainDb;
      } else if (cfg.imposterMinOct === Infinity) {
        f.gain.value = 0;
      } else {
        f.frequency.value = imposterFreq;
        f.gain.value = gainDb;
      }
    }
    p.select(0);
    setActivePlay(0);
  }, [cfg.allowCut, cfg.gainDb, cfg.q, cfg.imposterMinOct, ensurePlayer]);

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
      title="EQ Match"
      instruction="Pick the sound that matches the EQ curve"
      accent="#9b8bb4"
    >
      {shown && <EqCurve freq={shown.freq} gainDb={shown.gainDb} q={cfg.q} />}
      <ChoicePanels
        labels={['SELECT', 'SELECT']}
        playable
        activePlay={activePlay}
        onPlay={play}
        onSelect={answer}
        reveal={reveal}
      />
      <div className="studio-hint">Level {level} · one sound was EQ'd exactly as drawn</div>
    </GameShell>
  );
}
