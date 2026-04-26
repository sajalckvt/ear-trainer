import type { AnswerOption } from '../exercises/types';

interface AnswerGridProps {
  answers: AnswerOption[];
  correctId: string | number | null;  // known after the user answers
  guessedId: string | number | null;  // what the user picked (if wrong)
  locked: boolean;                     // disables all buttons
  onGuess: (id: string | number) => void;
}

export function AnswerGrid({ answers, correctId, guessedId, locked, onGuess }: AnswerGridProps) {
  return (
    <div className="ag">
      {answers.map((a) => {
        const isCorrect = locked && correctId !== null && a.id === correctId;
        const isWrong = locked && guessedId !== null && a.id === guessedId && guessedId !== correctId;
        let cls = 'ab';
        if (isCorrect) cls += ' co';
        else if (isWrong) cls += ' wr';
        else if (locked) cls += ' dm';

        return (
          <button
            key={String(a.id)}
            className={cls}
            style={{ '--ac': a.color } as React.CSSProperties}
            disabled={locked}
            onClick={() => onGuess(a.id)}
          >
            <span className="sh">{a.short}</span>
            {a.label}
            {a.hint && <span className="st-count">{a.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
