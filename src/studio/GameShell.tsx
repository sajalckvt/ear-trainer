/**
 * GameShell — the shared frame for studio games:
 * the app-wide ConfigBar on top (level / transport / run settings), score +
 * stage header, intro splash, reveal banner, green/red flash, and the
 * run-complete screen. No lives — misses cost points, never the run.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { StageGame } from './useStageGame';
import { ConfigBar, gotoReference } from '../components/ConfigBar';
import { getSettings } from './settings';

const STAGE_CHOICES = [4, 6, 8, 12];

export function GameShell({
  game,
  title,
  instruction,
  accent,
  children,
  controls,
  level,
  maxLevel = 8,
  onLevel,
  onStages,
  onRepeat,
  onPauseChange,
  topExtras,
  refAnchor,
  tip,
}: {
  game: StageGame;
  title: string;
  /** Instruction line on the intro splash, e.g. "Identify the boosted frequency". */
  instruction: string;
  /** Per-game accent colour for the backdrop. */
  accent: string;
  /** The play-area (answer widget) — rendered during playing/reveal. */
  children: ReactNode;
  /** Extra controls row (A/B toggles etc.) — rendered under the play area. */
  controls?: ReactNode;
  /** Free level selection — fixed menu at the top, changeable at any time. */
  level?: number;
  maxLevel?: number;
  onLevel?: (level: number) => void;
  /** Run-length override — null restores the level's default. */
  onStages?: (stages: number | null) => void;
  /** Replay the current stage's audio from the top (🔁). */
  onRepeat?: () => void;
  /** Observe global pause (freeze game-side timers). */
  onPauseChange?: (paused: boolean) => void;
  /** Game-specific config pills (e.g. Beat Copy's timer). */
  topExtras?: ReactNode;
  /** Reference-tab anchor for the 📖 theory button. */
  refAnchor?: string;
  /** Coaching tip for the current reveal (from studio/coaching). */
  tip?: string | null;
}) {
  const { phase, stage, stages, score, lastResult } = game;

  const [paused, setPaused] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(() => getSettings().autoAdvance);

  // Auto-advance from reveal after a beat (when enabled and not paused).
  // `game` gets a fresh identity every parent render, so depend on phase only.
  const nextRef = useRef(game.next);
  nextRef.current = game.next;
  useEffect(() => {
    // Re-read the setting each reveal — it can be flipped in the ConfigBar.
    if (phase === 'reveal') setAutoAdvance(getSettings().autoAdvance);
  }, [phase]);
  useEffect(() => {
    if (phase !== 'reveal' || !autoAdvance || paused) return;
    const t = setTimeout(() => nextRef.current(), 1400);
    return () => clearTimeout(t);
  }, [phase, autoAdvance, paused]);

  // Changing level or run length mid-run restarts the run with the new
  // config (the effect runs after the parent re-rendered with it). A level
  // change also clears any stage-count override, so each level presents its
  // own defaults.
  const startRef = useRef(game.start);
  startRef.current = game.start;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const onStagesRef = useRef(onStages);
  onStagesRef.current = onStages;
  const levelSeenRef = useRef(level);
  const stagesSeenRef = useRef(stages);
  useEffect(() => {
    const levelChanged = level !== levelSeenRef.current;
    const stagesChanged = stages !== stagesSeenRef.current;
    levelSeenRef.current = level;
    stagesSeenRef.current = stages;
    if (!levelChanged && !stagesChanged) return;
    if (levelChanged) onStagesRef.current?.(null); // restore the level's default run length
    if (phaseRef.current === 'playing' || phaseRef.current === 'reveal') {
      startRef.current();
    }
  }, [level, stages]);

  const flash =
    phase === 'reveal' ? (lastResult?.missed ? 'studio-flash-bad' : 'studio-flash-good') : '';

  return (
    <div className="studio-game" style={{ ['--studio-accent' as string]: accent }}>
      <div className="studio-frame">
        {level !== undefined && onLevel && (
          <ConfigBar
            levelLabels={Array.from({ length: maxLevel }, (_, i) => `${i + 1}`)}
            levelIndex={level - 1}
            onLevel={(i) => onLevel(i + 1)}
            stages={onStages ? stages : undefined}
            stageChoices={STAGE_CHOICES}
            onStages={onStages}
            onRepeat={onRepeat}
            onPauseChange={(p) => {
              setPaused(p);
              onPauseChange?.(p);
            }}
            extras={topExtras}
            refAnchor={refAnchor}
          />
        )}

        <div className="studio-hdr">
          <div className="studio-hdr-cell">
            <div className="studio-hdr-big">{score}</div>
            <div className="studio-hdr-label">SCORE</div>
          </div>
          <div className="studio-hdr-cell studio-hdr-mid">
            <div className="studio-hdr-big">{stage} / {stages}</div>
            <div className="studio-hdr-label">STAGE</div>
          </div>
          <div className="studio-hdr-cell studio-hdr-right">
            <div className="studio-hdr-title">{title}</div>
          </div>
        </div>

        {phase === 'intro' && (
          <div className="studio-splash">
            <div className="studio-splash-title">{instruction}</div>
            <div className="studio-splash-sub">{stages} stages · tune the run up top any time</div>
            <button className="studio-play-btn" onClick={game.start}>▶ Click to start</button>
          </div>
        )}

        {(phase === 'playing' || phase === 'reveal') && (
          <div className={`studio-stage-area ${flash}`}>
            {phase === 'reveal' && lastResult && (
              <>
                <div className="studio-result">
                  <span>
                    {lastResult.missed ? 'Missed' : 'Accurate'} · {Math.round(lastResult.accuracy * 100)}% · +{lastResult.points}
                    {lastResult.bonus > 0 && <span> · Bonus +{lastResult.bonus}</span>}
                  </span>
                  {!autoAdvance && (
                    <button className="studio-confirm" onClick={game.next}>Continue ›</button>
                  )}
                </div>
                {tip && (
                  <div className="studio-tip">
                    💡 {tip}
                    {refAnchor && (
                      <button className="studio-tip-ref" onClick={() => gotoReference(refAnchor)}>
                        📖
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
            {children}
            {controls && <div className="studio-controls-row">{controls}</div>}
          </div>
        )}

        {phase === 'complete' && (
          <div className="studio-splash">
            <div className="studio-splash-title">Run complete! 🎉</div>
            <div className="studio-splash-sub">{title} · final score {score} — try a higher level?</div>
            <button className="studio-play-btn" onClick={game.restart}>Play again</button>
          </div>
        )}
      </div>
    </div>
  );
}

/** A/B pill toggle (Question/Yours, EQ on/off, Before/After…). */
export function ABToggle({
  labels,
  active,
  onSelect,
}: {
  labels: [string, string];
  active: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="studio-ab">
      {labels.map((l, i) => (
        <button
          key={l}
          className={`studio-ab-btn${active === i ? ' on' : ''}`}
          onClick={() => onSelect(i)}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
