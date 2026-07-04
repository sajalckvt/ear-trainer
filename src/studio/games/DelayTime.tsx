/**
 * Delay Time — a single echo is mixed onto the drum loop at a hidden
 * delay time. Toggle No Delay / With Delay, then pick the right ms value.
 */

import { useCallback, useRef, useState } from 'react';
import { ABLoopPlayer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { drumLoop } from '../loops';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell, ABToggle } from '../GameShell';
import { ChoicePanels } from '../widgets/ChoicePanels';
import { getProgress } from '../progress';

const GAME_ID = 'delay-time';

const DELAYS = [25, 50, 85, 120, 180, 250, 350, 500, 700]; // ms

function levelCfg(level: number) {
  return {
    stages: 12,
    idxGap: Math.max(4 - (level - 1), 1), // candidate distance in the DELAYS set
  };
}

export function DelayTime() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const [ab, setAb] = useState(1);
  const [labels, setLabels] = useState<string[]>(['', '']);
  const correctRef = useRef(0);
  const [reveal, setReveal] = useState<{ correct: number; yours: number } | null>(null);

  const ensurePlayer = useCallback(async (): Promise<ABLoopPlayer> => {
    if (playerRef.current) return playerRef.current;
    const buf = await drumLoop();
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(2);
    player.passthrough(0); // no delay
    const ctx = ensureCtx();
    const { input, output } = player.chain(1); // with delay: dry + echo
    input.connect(output);
    const d = ctx.createDelay(1.0);
    const echo = ctx.createGain();
    echo.gain.value = 0.55;
    input.connect(d);
    d.connect(echo);
    echo.connect(output);
    delayRef.current = d;
    playerRef.current = player;
    player.start(buf);
    return player;
  }, []);

  const onStage = useCallback(() => {
    setReveal(null);
    setAb(1);
    const ci = Math.floor(Math.random() * DELAYS.length);
    const dirs = [ci - cfg.idxGap, ci + cfg.idxGap].filter((j) => j >= 0 && j < DELAYS.length);
    const oi = dirs[Math.floor(Math.random() * dirs.length)];
    const correctIdx = Math.random() < 0.5 ? 0 : 1;
    correctRef.current = correctIdx;
    const lbl = (i: number) => `${DELAYS[i]} ms`;
    setLabels(correctIdx === 0 ? [lbl(ci), lbl(oi)] : [lbl(oi), lbl(ci)]);

    void ensurePlayer().then((p) => {
      if (delayRef.current) delayRef.current.delayTime.value = DELAYS[ci] / 1000;
      p.select(1);
    });
  }, [cfg.idxGap, ensurePlayer]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });
  usePlayerTeardown(game.phase, playerRef);

  const selectAb = (i: number) => {
    setAb(i);
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
      title="Delay Time"
      instruction="Pick the delay time"
      accent="#e8b48d"
      controls={<ABToggle labels={['No Delay', 'With Delay']} active={ab} onSelect={selectAb} />}
    >
      <ChoicePanels labels={labels} onSelect={answer} reveal={reveal} />
      <div className="studio-hint">Level {level} · estimate the gap between the dry hit and its echo</div>
    </GameShell>
  );
}
