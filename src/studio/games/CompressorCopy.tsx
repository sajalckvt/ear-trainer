/**
 * Compressor Copy — a hidden compressor squashes the drum loop. Most
 * parameters are given; pick the missing one by ear (and set makeup gain to
 * level-match while comparing). GR meter shows your chain's live reduction.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ABLoopPlayer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { drumLoop } from '../loops';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell, ABToggle } from '../GameShell';
import { CompressorPanel, type CompCol } from '../widgets/CompressorPanel';
import { getProgress } from '../progress';

const GAME_ID = 'compressor-copy';

const RATIOS = [2, 4, 8];
const ATTACKS = [0, 10, 25, 50, 75, 100]; // ms
const RELEASES = [25, 50, 100, 150, 200, 300]; // ms
const THRESHOLD = -35;

type Param = 'ratio' | 'attack' | 'release';

const ALL_PARAMS: Param[] = ['ratio', 'attack', 'release'];

/** The chosen level decides how many columns are quizzed at once. */
function levelCfg(level: number) {
  return {
    stages: 8,
    quizCount: level >= 5 ? 3 : level >= 3 ? 2 : 1,
  };
}

interface StageState {
  target: { ratio: number; attack: number; release: number }; // indices
  quiz: Param[];
  picked: Record<Param, number | null>;
}

export function CompressorCopy() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const compsRef = useRef<[DynamicsCompressorNode, DynamicsCompressorNode] | null>(null);
  const makeupsRef = useRef<[GainNode, GainNode] | null>(null);
  const [st, setSt] = useState<StageState | null>(null);
  const [ab, setAb] = useState(0);
  const [makeup, setMakeup] = useState(6);
  const [gr, setGr] = useState(0);
  const [revealed, setRevealed] = useState(false);

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
      c.knee.value = 4;
      const m = ctx.createGain();
      player.chain(i).input.connect(c);
      c.connect(m);
      m.connect(player.chain(i).output);
      comps.push(c);
      makeups.push(m);
    }
    makeups[0].gain.value = 2; // question chain: fixed ≈ +6 dB makeup
    compsRef.current = comps as [DynamicsCompressorNode, DynamicsCompressorNode];
    makeupsRef.current = makeups as [GainNode, GainNode];
    playerRef.current = player;
    player.start(buf);
    return player;
  }, []);

  const applyComp = (c: DynamicsCompressorNode, ratioI: number, attackI: number, releaseI: number) => {
    c.threshold.value = THRESHOLD;
    c.ratio.value = RATIOS[ratioI];
    c.attack.value = ATTACKS[attackI] / 1000;
    c.release.value = Math.max(RELEASES[releaseI], 10) / 1000;
  };

  const applyUser = useCallback((s: StageState) => {
    const comps = compsRef.current;
    if (!comps) return;
    const u = { ...s.target };
    for (const p of s.quiz) u[p] = s.picked[p] ?? 0;
    applyComp(comps[1], u.ratio, u.attack, u.release);
  }, []);

  const onStage = useCallback(() => {
    setRevealed(false);
    setAb(0);
    setMakeup(6);
    const target = {
      ratio: Math.floor(Math.random() * RATIOS.length),
      attack: Math.floor(Math.random() * ATTACKS.length),
      release: Math.floor(Math.random() * RELEASES.length),
    };
    // sample quizCount distinct params
    const quiz = [...ALL_PARAMS].sort(() => Math.random() - 0.5).slice(0, cfg.quizCount);
    const s: StageState = { target, quiz, picked: { ratio: null, attack: null, release: null } };
    setSt(s);
    void ensurePlayer().then((p) => {
      applyComp(compsRef.current![0], target.ratio, target.attack, target.release);
      applyUser(s);
      if (makeupsRef.current) makeupsRef.current[1].gain.value = Math.pow(10, 6 / 20);
      p.select(0);
    });
  }, [cfg.quizCount, ensurePlayer, applyUser]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });
  usePlayerTeardown(game.phase, playerRef);

  // Live GR meter for your chain (10 Hz poll — cheap, no 60 fps rerenders)
  useEffect(() => {
    if (game.phase !== 'playing') return;
    const id = setInterval(() => {
      const c = compsRef.current?.[1];
      if (c) setGr(Math.max(0, -c.reduction));
    }, 100);
    return () => clearInterval(id);
  }, [game.phase]);

  const pick = (colIdx: number, optIdx: number) => {
    if (!st || revealed) return;
    const param = ALL_PARAMS[colIdx];
    if (!st.quiz.includes(param)) return;
    const s: StageState = { ...st, picked: { ...st.picked, [param]: optIdx } };
    setSt(s);
    applyUser(s);
  };

  const changeMakeup = (db: number) => {
    setMakeup(db);
    if (makeupsRef.current) makeupsRef.current[1].gain.value = Math.pow(10, db / 20);
  };

  const selectAb = (i: number) => {
    setAb(i);
    playerRef.current?.select(i);
  };

  const allPicked = !!st && st.quiz.every((p) => st.picked[p] !== null);

  const confirm = () => {
    if (game.phase !== 'playing' || !st || !allPicked) return;
    setRevealed(true);
    // mean over the quizzed params: each is right or wrong
    const acc =
      st.quiz.reduce((sum, p) => sum + (st.picked[p] === st.target[p] ? 1 : 0), 0) /
      st.quiz.length;
    game.submit(acc);
  };

  const OPTION_LABELS: Record<Param, string[]> = {
    ratio: RATIOS.map((r) => `${r}:1`),
    attack: ATTACKS.map((a) => `${a} ms`),
    release: RELEASES.map((r) => `${r} ms`),
  };
  const COL_LABELS: Record<Param, string> = { ratio: 'Ratio', attack: 'Attack', release: 'Release' };

  const cols: CompCol[] = st
    ? ALL_PARAMS.map((param) => {
        const quizzed = st.quiz.includes(param);
        return {
          label: COL_LABELS[param],
          options: OPTION_LABELS[param],
          selected: quizzed ? st.picked[param] : st.target[param],
          locked: !quizzed,
          correct: revealed && quizzed ? st.target[param] : null,
        };
      })
    : [];

  return (
    <GameShell
      game={game}
      level={level}
      maxLevel={8}
      onLevel={setLevel}
      onStages={setStagesSel}
      title="Compressor Copy"
      instruction="Restore the missing compressor setting"
      accent="#7a86b8"
      controls={
        <>
          <ABToggle labels={['Compressed', 'Yours']} active={ab} onSelect={selectAb} />
          <button
            className="studio-confirm"
            onClick={confirm}
            disabled={game.phase !== 'playing' || !allPicked}
          >
            ✓ Confirm
          </button>
        </>
      }
    >
      {st && (
        <CompressorPanel
          cols={cols}
          onPick={pick}
          makeupDb={makeup}
          onMakeup={changeMakeup}
          grDb={gr}
          revealed={revealed}
        />
      )}
      <div className="studio-hint">
        Level {level} · {cfg.quizCount === 1 ? 'one column is' : `${cfg.quizCount} columns are`} the
        question — pick by ear, use makeup to level-match
      </div>
    </GameShell>
  );
}
