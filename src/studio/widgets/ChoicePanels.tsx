/**
 * ChoicePanels — the N-panel answer selector used by the compare games
 * (Gain Difference, Delay Time, Distortion, Compression, Reverb Difference,
 * EQ Match).
 *
 * Two modes:
 * - value panels (playable=false): each panel shows a candidate value
 *   ("250 ms", "-9 dB"); clicking the panel answers. Audition happens via a
 *   separate A/B toggle in the controls row.
 * - playable panels: clicking a panel auditions that sound (crossfade),
 *   the SELECT button underneath answers.
 */

export function ChoicePanels({
  labels,
  playable,
  activePlay,
  onPlay,
  onSelect,
  reveal,
}: {
  labels: string[];
  playable?: boolean;
  /** Which panel is currently audible (playable mode). */
  activePlay?: number;
  onPlay?: (i: number) => void;
  onSelect: (i: number) => void;
  /** After answering: indices for colouring. */
  reveal?: { correct: number; yours: number } | null;
}) {
  return (
    <div className="studio-panels" data-count={labels.length}>
      {labels.map((label, i) => {
        let cls = 'studio-panel';
        if (reveal) {
          if (i === reveal.correct) cls += ' good';
          else if (i === reveal.yours) cls += ' bad';
        } else if (playable && activePlay === i) {
          cls += ' active';
        }
        return (
          <div key={i} className={cls}>
            {playable ? (
              <>
                <button
                  className="studio-panel-play"
                  onClick={() => onPlay?.(i)}
                  disabled={!!reveal}
                  aria-label={`Play sound ${i + 1}`}
                >
                  ▶
                </button>
                <button
                  className="studio-panel-select"
                  onClick={() => onSelect(i)}
                  disabled={!!reveal}
                >
                  {label || 'SELECT'}
                </button>
              </>
            ) : (
              <button
                className="studio-panel-value"
                onClick={() => onSelect(i)}
                disabled={!!reveal}
              >
                {label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
