/**
 * GameShell — the shared frame for studio games:
 * fixed config bar on top (LEVEL / STAGES / game extras / AUTO / STRICT),
 * score + stage header, intro splash, reveal banner, green/red flash, and
 * the run-complete screen. No lives — misses cost points, never the run.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { StageGame } from './useStageGame';
import { getSettings, setSettings, type Strictness } from './settings';

const STAGE_CHOICES = [4, 6, 8, 12];
const STRICTNESS_LABELS: { id: Strictness; label: string }[] = [
  { id: 'loose', label: 'Forgiving' },
  { id: 'normal', label: 'Standard' },
  { id: 'strict', label: 'Precise' },
];

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
  topExtras,
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
  /** Game-specific config pills (e.g. Beat Copy's timer). */
  topExtras?: ReactNode;
}) {
  const { phase, stage, stages, score, lastResult } = game;

  const [settings, setSettingsState] = useState(getSettings);
  const [cfgOpen, setCfgOpen] = useState(false);
  const changeSettings = (patch: Parameters<typeof setSettings>[0]) =>
    setSettingsState(setSettings(patch));

  // Auto-advance from reveal after a beat (when enabled). `game` gets a
  // fresh identity every parent render, so depend on phase only.
  const nextRef = useRef(game.next);
  nextRef.current = game.next;
  useEffect(() => {
    if (phase !== 'reveal' || !settings.autoAdvance) return;
    const t = setTimeout(() => nextRef.current(), 1400);
    return () => clearTimeout(t);
  }, [phase, settings.autoAdvance]);

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
        <div className="studio-topbar">
          <div className="studio-topbar-main">
            {level !== undefined && onLevel && (
              <div className="studio-levels">
                <span className="studio-levels-label">LEVEL</span>
                {Array.from({ length: maxLevel }, (_, i) => (
                  <button
                    key={i}
                    className={`studio-level-btn${level === i + 1 ? ' on' : ''}`}
                    onClick={() => onLevel(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
            <button
              className={`studio-gear${cfgOpen ? ' on' : ''}`}
              onClick={() => setCfgOpen((o) => !o)}
              aria-label="Run settings"
              title="Run settings"
            >
              ⚙
            </button>
          </div>
          {cfgOpen && (
            <div className="studio-config-row">
              {onStages && (
                <div className="studio-levels">
                  <span className="studio-levels-label">STAGES</span>
                  {STAGE_CHOICES.map((n) => (
                    <button
                      key={n}
                      className={`studio-level-btn${stages === n ? ' on' : ''}`}
                      onClick={() => onStages(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {topExtras}
              <div className="studio-levels">
                <span className="studio-levels-label">SCORING</span>
                {STRICTNESS_LABELS.map((s) => (
                  <button
                    key={s.id}
                    className={`studio-level-btn wide${settings.strictness === s.id ? ' on' : ''}`}
                    onClick={() => changeSettings({ strictness: s.id })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <label className="studio-autonext">
                <input
                  type="checkbox"
                  checked={settings.autoAdvance}
                  onChange={(e) => changeSettings({ autoAdvance: e.target.checked })}
                />
                auto next
              </label>
            </div>
          )}
        </div>

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
              <div className="studio-result">
                <span>
                  {lastResult.missed ? 'Missed' : 'Accurate'} · {Math.round(lastResult.accuracy * 100)}% · +{lastResult.points}
                  {lastResult.bonus > 0 && <span> · Bonus +{lastResult.bonus}</span>}
                </span>
                {!settings.autoAdvance && (
                  <button className="studio-confirm" onClick={game.next}>Continue ›</button>
                )}
              </div>
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
