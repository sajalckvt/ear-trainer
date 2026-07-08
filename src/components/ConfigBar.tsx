/**
 * ConfigBar — the one level/config bar used by BOTH the Train tab and every
 * Studio game, so the two halves of the app look and behave the same:
 *
 *   [ LEVEL pills ]  [⏸/▶] [🔁] [⚙]
 *   (gear expands:)  STAGES · game extras · SCORING · auto next
 *
 * Pause is global (suspends the shared AudioContext); auto-next and scoring
 * strictness are the global persisted settings from studio/settings.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { setAudioPaused } from '../audio/engine';
import { getSettings, setSettings, type Strictness } from '../studio/settings';

const STRICTNESS_LABELS: { id: Strictness; label: string }[] = [
  { id: 'loose', label: 'Forgiving' },
  { id: 'normal', label: 'Standard' },
  { id: 'strict', label: 'Precise' },
];

/** Jump to the Reference tab at an anchor (handled in App + ReferencePage). */
export function gotoReference(anchor: string): void {
  window.dispatchEvent(new CustomEvent('et-goto-ref', { detail: anchor }));
}

export function ConfigBar({
  levelLabels,
  levelIndex,
  onLevel,
  stages,
  stageChoices,
  onStages,
  onRepeat,
  onPauseChange,
  extras,
  showScoring = true,
  refAnchor,
}: {
  levelLabels: string[];
  levelIndex: number; // 0-based
  onLevel: (i: number) => void;
  /** Current run length (0 = endless). Omit to hide the STAGES group. */
  stages?: number;
  stageChoices?: number[]; // 0 renders as ∞
  onStages?: (n: number | null) => void;
  /** Replay the current question/loop from the top. Omit to hide 🔁. */
  onRepeat?: () => void;
  /** Observe the global pause state (e.g. to freeze timers). */
  onPauseChange?: (paused: boolean) => void;
  /** Game-specific config pills (e.g. Beat Copy's timer). */
  extras?: ReactNode;
  showScoring?: boolean;
  /** Reference-tab anchor for the 📖 theory button (e.g. "ref-eq"). */
  refAnchor?: string;
}) {
  const [settings, setSettingsState] = useState(getSettings);
  const [cfgOpen, setCfgOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  const changeSettings = (patch: Parameters<typeof setSettings>[0]) =>
    setSettingsState(setSettings(patch));

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    setAudioPaused(next);
    onPauseChange?.(next);
  };

  // Never leave the app globally paused when this bar goes away.
  useEffect(() => () => setAudioPaused(false), []);

  return (
    <div className="studio-topbar">
      <div className="studio-topbar-main">
        <div className="studio-levels">
          <span className="studio-levels-label">LEVEL</span>
          {levelLabels.map((label, i) => (
            <button
              key={label + i}
              className={`studio-level-btn${label.length > 2 ? ' wide' : ''}${levelIndex === i ? ' on' : ''}`}
              onClick={() => onLevel(i)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className={`studio-gear${paused ? ' on' : ''}`}
          onClick={togglePause}
          aria-label={paused ? 'Resume audio' : 'Pause audio'}
          title={paused ? 'Resume audio' : 'Pause audio'}
        >
          {paused ? '▶' : '⏸'}
        </button>
        {onRepeat && (
          <button
            className="studio-gear"
            onClick={onRepeat}
            aria-label="Repeat from the top"
            title="Repeat from the top"
          >
            🔁
          </button>
        )}
        {refAnchor && (
          <button
            className="studio-gear"
            onClick={() => gotoReference(refAnchor)}
            aria-label="Theory for this game"
            title="Theory for this game"
          >
            📖
          </button>
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
          {stages !== undefined && onStages && stageChoices && (
            <div className="studio-levels">
              <span className="studio-levels-label">STAGES</span>
              {stageChoices.map((n) => (
                <button
                  key={n}
                  className={`studio-level-btn${stages === n ? ' on' : ''}`}
                  onClick={() => onStages(n)}
                >
                  {n === 0 ? '∞' : n}
                </button>
              ))}
            </div>
          )}
          {extras}
          {showScoring && (
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
          )}
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
  );
}
