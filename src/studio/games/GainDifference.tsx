/**
 * Gain Difference — the drum loop plays at two gain settings ("Before" / "After").
 * Two candidate dB differences are shown; pick the real one.
 */

import { useCallback, useRef, useState } from 'react';
import { ABLoopPlayer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { drumLoop } from '../loops';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell, ABToggle } from '../GameShell';
import { ChoicePanels } from '../widgets/ChoicePanels';
import { getProgress } from '../progress';

const GAME_ID = 'gain-difference';

function levelCfg(level: number) {
  return {
    stages: 12,
    magLo: 3,
    magHi: 12,
    gap: Math.max(7 - (level - 1) * 1.5, 1.5), // dB between candidates
  };
}

const fmtDb = (d: number) => `${d > 0 ? '+' : ''}${d} dB`;
const round5 = (x: number) => Math.round(x * 2) / 2;

export function GainDifference() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [ab, setAb] = useState(0);
  const [labels, setLabels] = useState<string[]>(['', '']);
  const correctRef = useRef(0);
  const [reveal, setReveal] = useState<{ correct: number; yours: number } | null>(null);

  const ensurePlayer = useCallback(async (): Promise<ABLoopPlayer> => {
    if (playerRef.current) return playerRef.current;
    const buf = await drumLoop();
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(2);
    player.passthrough(0); // before
    const ctx = ensureCtx();
    const g = ctx.createGain(); // after = before ± diff dB
    player.chain(1).input.connect(g);
    g.connect(player.chain(1).output);
    gainRef.current = g;
    playerRef.current = player;
    player.start(buf);
    return player;
  }, []);

  const onStage = useCallback(() => {
    setReveal(null);
    setAb(0);
    // Real difference and a distractor `gap` dB away
    const sign = Math.random() < 0.5 ? -1 : 1;
    const diff = sign * round5(cfg.magLo + Math.random() * (cfg.magHi - cfg.magLo));
    let other = round5(diff + (Math.random() < 0.5 ? -1 : 1) * (cfg.gap + Math.random() * 3));
    if (Math.abs(other) > 14) other = round5(diff - Math.sign(diff) * (cfg.gap + 1));
    if (other === diff) other = diff + cfg.gap;

    const correctIdx = Math.random() < 0.5 ? 0 : 1;
    correctRef.current = correctIdx;
    setLabels(correctIdx === 0 ? [fmtDb(diff), fmtDb(other)] : [fmtDb(other), fmtDb(diff)]);

    void ensurePlayer().then((p) => {
      if (gainRef.current) gainRef.current.gain.value = Math.pow(10, diff / 20);
      p.select(0);
    });
  }, [cfg.magLo, cfg.magHi, cfg.gap, ensurePlayer]);

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
      title="Gain Difference"
      instruction="Pick the gain change in dB"
      accent="#5b93b4"
      controls={<ABToggle labels={['Before Gain', 'After Gain']} active={ab} onSelect={selectAb} />}
    >
      <ChoicePanels labels={labels} onSelect={answer} reveal={reveal} />
      <div className="studio-hint">Level {level} · compare Before/After, then pick the difference</div>
    </GameShell>
  );
}
