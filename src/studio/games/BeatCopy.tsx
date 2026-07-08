/**
 * Beat Copy — listen to a target drum pattern, recreate it on the 16-step
 * grid before the timer runs out. Scored by pattern overlap (Jaccard).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { drumHits, type DrumHit } from '../loops';
import { StepSequencer, STEPS } from '../sequencer';
import { ensureCtx } from '../../audio/engine';
import { useStageGame } from '../useStageGame';
import { GameShell } from '../GameShell';
import { getProgress } from '../progress';

const GAME_ID = 'beat-copy';

const LANE_ORDER: DrumHit[] = ['kick', 'snare', 'hat', 'clap'];
const LANE_LABELS: Record<DrumHit, string> = { kick: 'BD', snare: 'SN', hat: 'HH', clap: 'CL' };

function levelCfg(level: number) {
  return {
    stages: 3,
    lanes: level >= 3 ? 4 : 3,
    maxActive: 8 + level * 2,
    timerSecs: Math.max(120 - (level - 1) * 15, 60),
  };
}

/** Jaccard overlap of two patterns (verified numerically). */
export function patternAccuracy(target: boolean[][], yours: boolean[][]): number {
  let inter = 0, union = 0;
  for (let l = 0; l < target.length; l++) {
    for (let s = 0; s < target[l].length; s++) {
      const a = target[l][s], b = yours[l][s];
      if (a && b) inter++;
      if (a || b) union++;
    }
  }
  return union === 0 ? 1 : inter / union;
}

function generatePattern(lanes: number, maxActive: number): boolean[][] {
  const p: boolean[][] = Array.from({ length: lanes }, () => Array(STEPS).fill(false) as boolean[]);
  const prob = (lane: DrumHit, s: number): number => {
    switch (lane) {
      case 'kick': return s === 0 ? 1 : s % 4 === 0 ? 0.6 : 0.12;
      case 'snare': return s === 4 || s === 12 ? 0.8 : 0.06;
      case 'hat': return s % 2 === 0 ? 0.45 : 0.18;
      case 'clap': return 0.1;
    }
  };
  for (let l = 0; l < lanes; l++) {
    for (let s = 0; s < STEPS; s++) p[l][s] = Math.random() < prob(LANE_ORDER[l], s);
  }
  // clamp density: trim random extras / ensure a minimum
  const active = () => p.flatMap((row, l) => row.map((v, s) => (v ? [l, s] : null)).filter(Boolean)) as [number, number][];
  let cells = active();
  while (cells.length > maxActive) {
    const [l, s] = cells[Math.floor(Math.random() * cells.length)];
    if (l === 0 && s === 0) { cells = cells.filter(([a, b]) => !(a === l && b === s)); continue; }
    p[l][s] = false;
    cells = active();
  }
  while (active().length < 4) {
    p[Math.floor(Math.random() * lanes)][Math.floor(Math.random() * STEPS)] = true;
  }
  return p;
}

const emptyPattern = (lanes: number): boolean[][] =>
  Array.from({ length: lanes }, () => Array(STEPS).fill(false) as boolean[]);

const TIMER_CHOICES = [0, 60, 90, 120]; // 0 = no timer

export function BeatCopy() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const [timerSel, setTimerSel] = useState<number | null>(null);
  const cfg = levelCfg(level);
  const timerSecs = timerSel ?? cfg.timerSecs;

  const seqRef = useRef<StepSequencer | null>(null);
  const targetRef = useRef<boolean[][]>(emptyPattern(cfg.lanes));
  const [yours, setYours] = useState<boolean[][]>(() => emptyPattern(cfg.lanes));
  const [mode, setMode] = useState<'target' | 'yours' | 'stopped'>('stopped');
  const [playhead, setPlayhead] = useState(-1);
  const [secsLeft, setSecsLeft] = useState(cfg.timerSecs);
  const [reveal, setReveal] = useState<boolean[][] | null>(null);
  const [paused, setPaused] = useState(false);
  const yoursRef = useRef(yours);
  yoursRef.current = yours;

  // Changing the timer config resets the current countdown; a level change
  // restores that level's default timer.
  useEffect(() => { setSecsLeft(timerSecs); setPaused(false); }, [timerSecs]);
  useEffect(() => { setTimerSel(null); }, [level]);

  const ensureSeq = useCallback(async (): Promise<StepSequencer> => {
    if (seqRef.current) return seqRef.current;
    const hits = await drumHits();
    if (seqRef.current) return seqRef.current;
    const seq = new StepSequencer(LANE_ORDER.slice(0, cfg.lanes).map((l) => hits[l]));
    seq.onStep = (s) => setPlayhead(s);
    seqRef.current = seq;
    return seq;
  }, [cfg.lanes]);

  const playPattern = useCallback((which: 'target' | 'yours') => {
    void ensureSeq().then((seq) => {
      seq.pattern = which === 'target' ? targetRef.current : yoursRef.current;
      setMode(which);
      if (!seq.playing) seq.start();
    });
  }, [ensureSeq]);

  const stopSeq = () => {
    seqRef.current?.stop();
    setMode('stopped');
    setPlayhead(-1);
  };

  const onStage = useCallback((stage: number) => {
    setReveal(null);
    targetRef.current = generatePattern(cfg.lanes, cfg.maxActive);
    setYours(emptyPattern(cfg.lanes));
    setSecsLeft(timerSecs);
    // the beat changes across stages: new pattern every stage, new tempo too
    void ensureSeq().then((seq) => { seq.bpm = 88 + ((stage - 1) % 3) * 14; });
    playPattern('target');
  }, [cfg.lanes, cfg.maxActive, timerSecs, ensureSeq, playPattern]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });

  const confirm = useCallback(() => {
    if (game.phase !== 'playing') return;
    stopSeq();
    const acc = patternAccuracy(targetRef.current, yoursRef.current);
    setReveal(targetRef.current);
    game.submit(acc);
  }, [game]);
  const confirmRef = useRef(confirm);
  confirmRef.current = confirm;

  // Countdown — auto-confirm at 0 (disabled when the timer is off or paused)
  useEffect(() => {
    if (game.phase !== 'playing' || timerSecs === 0 || paused) return;
    const id = setInterval(() => {
      setSecsLeft((s) => {
        if (s <= 1) { confirmRef.current(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [game.phase, game.stage, timerSecs, paused]);

  // Sequencer teardown at run end / unmount, and rebuild when the lane
  // count changes (level switch mid-run restarts with a fresh sequencer).
  useEffect(() => {
    if (game.phase === 'complete' || game.phase === 'intro') {
      seqRef.current?.dispose();
      seqRef.current = null;
      setMode('stopped');
      setPlayhead(-1);
    }
  }, [game.phase]);
  useEffect(() => {
    seqRef.current?.dispose();
    seqRef.current = null;
  }, [cfg.lanes]);
  useEffect(() => () => { seqRef.current?.dispose(); seqRef.current = null; }, []);

  const toggleCell = (l: number, s: number) => {
    if (game.phase !== 'playing' || reveal || !yours[l]) return;
    const turningOn = !yours[l][s];
    setYours((p) => {
      const next = p.map((row) => [...row]);
      next[l][s] = !next[l][s];
      if (seqRef.current && mode === 'yours') seqRef.current.pattern = next;
      return next;
    });
    // audition the hit when placing it
    if (turningOn) {
      void drumHits().then((hits) => {
        const ctx = ensureCtx();
        const src = ctx.createBufferSource();
        src.buffer = hits[LANE_ORDER[l]];
        const g = ctx.createGain();
        g.gain.value = 0.3;
        src.connect(g);
        g.connect(ctx.destination);
        src.start();
      });
    }
  };

  const cellCls = (l: number, s: number): string => {
    let cls = 'beat-cell';
    if (playhead === s && mode !== 'stopped') cls += ' ph';
    const on = yours[l]?.[s] ?? false;
    if (!reveal) {
      if (on) cls += ' on';
    } else {
      const t = reveal[l]?.[s] ?? false;
      if (on && t) cls += ' good';
      else if (on && !t) cls += ' bad';
      else if (!on && t) cls += ' missed';
    }
    return cls;
  };

  return (
    <GameShell
      game={game}
      level={level}
      maxLevel={8}
      onLevel={setLevel}
      onStages={setStagesSel}
      refAnchor="ref-rhythm"
      onRepeat={() => playPattern('target')}
      onPauseChange={setPaused}
      title="Beat Copy"
      instruction="Listen to the beat, then program it on the grid"
      accent="#c98f4a"
      topExtras={
        <div className="studio-levels">
          <span className="studio-levels-label">TIMER</span>
          {TIMER_CHOICES.map((t) => (
            <button
              key={t}
              className={`studio-level-btn wide${timerSecs === t ? ' on' : ''}`}
              onClick={() => setTimerSel(t)}
            >
              {t === 0 ? 'Off' : `${t}s`}
            </button>
          ))}
        </div>
      }
      controls={
        <>
          <div className="studio-ab">
            <button className={`studio-ab-btn${mode === 'target' ? ' on' : ''}`} onClick={() => playPattern('target')}>▶ Target</button>
            <button className={`studio-ab-btn${mode === 'yours' ? ' on' : ''}`} onClick={() => playPattern('yours')}>▶ Yours</button>
            <button className="studio-ab-btn" onClick={stopSeq}>⏹</button>
          </div>
          <button className="studio-confirm" onClick={confirm} disabled={game.phase !== 'playing'}>
            ✓ Confirm
          </button>
        </>
      }
    >
      <div className="beat-timer">
        {timerSecs === 0 ? '∞' : `${Math.floor(secsLeft / 60)}:${String(secsLeft % 60).padStart(2, '0')}`}
        {timerSecs > 0 && game.phase === 'playing' && (
          <button
            className="beat-pause"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Resume timer' : 'Pause timer'}
          >
            {paused ? '▶' : '⏸'}
          </button>
        )}
      </div>
      <div className="beat-grid">
        {Array.from({ length: cfg.lanes }, (_, l) => (
          <div className="beat-row" key={l}>
            <div className="beat-lane">{LANE_LABELS[LANE_ORDER[l]]}</div>
            {Array.from({ length: STEPS }, (_, s) => (
              <button
                key={s}
                className={cellCls(l, s)}
                data-beat={s % 4 === 0 ? '1' : undefined}
                onClick={() => toggleCell(l, s)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="studio-hint">
        Level {level} · replay the target as often as you like — beat the clock
      </div>
    </GameShell>
  );
}
