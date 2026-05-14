import { useState } from 'react';

interface ScoreBarProps {
  correct: number;
  total: number;
  streak: number;
  best: number;
  nearMisses: number;
  timerLabel: string;
  onResetScore: () => void;
  onResetTimer: () => void;
}

export function ScoreBar({
  correct, total, streak, best, nearMisses, timerLabel,
  onResetScore, onResetTimer,
}: ScoreBarProps) {
  const [expanded, setExpanded] = useState(false);
  const acc = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="scorebar">
      {/* ── Main row: always visible ── */}
      <div className="scorebar-main">
        <div className="score-cells">
          <div className="sc">
            <div className="v" style={{ color: '#22c55e' }}>{correct}/{total}</div>
            <div className="l">Score</div>
          </div>
          <div className="sc">
            <div className="v" style={{ color: '#3b82f6' }}>{acc}%</div>
            <div className="l">Acc</div>
          </div>
          <div className="sc">
            <div className="v" style={{ color: '#f59e0b' }}>
              {streak > 0 ? `🔥 ${streak}` : streak}
            </div>
            <div className="l">Streak</div>
          </div>
        </div>
        <button
          className="scorebar-more"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Hide details' : 'Show details'}
        >
          {expanded ? '✕' : '⋯'}
        </button>
      </div>

      {/* ── Accuracy bar ── */}
      <div className="acc-bar">
        <div
          className="acc-fill"
          style={{ width: `${acc}%` }}
        />
      </div>

      {/* ── Expanded row: best, near misses, timer, resets ── */}
      {expanded && (
        <div className="scorebar-extra">
          <div className="sc">
            <div className="v" style={{ color: '#ec4899' }}>{best}</div>
            <div className="l">Best streak</div>
          </div>
          <div className="sc">
            <div className="v" style={{ color: '#a855f7' }}>{nearMisses}</div>
            <div className="l">Near misses</div>
          </div>
          <div className="sc">
            <div className="v" style={{ color: '#14b8a6' }}>{timerLabel}</div>
            <div className="l">This week</div>
          </div>
          <div className="scorebar-resets">
            <button className="rbtn" onClick={onResetScore}>Reset score</button>
            <button className="rbtn" onClick={onResetTimer}>Reset timer</button>
          </div>
        </div>
      )}
    </div>
  );
}
