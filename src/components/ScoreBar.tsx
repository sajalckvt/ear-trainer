interface ScoreBarProps {
  correct: number;
  total: number;
  streak: number;
  best: number;
  timerLabel: string;
  onResetScore: () => void;
  onResetTimer: () => void;
}

export function ScoreBar({
  correct,
  total,
  streak,
  best,
  timerLabel,
  onResetScore,
  onResetTimer,
}: ScoreBarProps) {
  const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="score-row">
      <div className="sc">
        <div className="v" style={{ color: '#22c55e' }}>{correct}/{total}</div>
        <div className="l">Score</div>
      </div>
      <div className="sc">
        <div className="v" style={{ color: '#3b82f6' }}>{acc}%</div>
        <div className="l">Acc</div>
      </div>
      <div className="sc">
        <div className="v" style={{ color: '#f59e0b' }}>{streak}</div>
        <div className="l">Streak</div>
      </div>
      <div className="sc">
        <div className="v" style={{ color: '#ec4899' }}>{best}</div>
        <div className="l">Best</div>
      </div>
      <div className="sc">
        <div className="v" style={{ color: '#14b8a6' }}>{timerLabel}</div>
        <div className="l">This week</div>
      </div>
      <button className="rbtn" onClick={onResetScore}>Reset score</button>
      <button className="rbtn" onClick={onResetTimer}>Reset timer</button>
    </div>
  );
}
