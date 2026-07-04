/**
 * CompressorPanel — the device face for Compressor Copy: radio columns
 * (Ratio / Attack / Release), a makeup-gain fader, and a live gain-reduction
 * meter. Locked columns show given values; the quizzed column takes input.
 */

export interface CompCol {
  label: string;
  options: string[];
  selected: number | null;
  locked: boolean;
  /** On reveal: index of the correct option. */
  correct?: number | null;
}

export function CompressorPanel({
  cols,
  onPick,
  makeupDb,
  onMakeup,
  grDb,
  revealed,
}: {
  cols: CompCol[];
  onPick: (col: number, opt: number) => void;
  makeupDb: number;
  onMakeup: (db: number) => void;
  /** Current gain reduction in dB (positive number). */
  grDb: number;
  revealed: boolean;
}) {
  return (
    <div className="comp-panel">
      {cols.map((c, ci) => (
        <div className={`comp-col${c.locked ? ' locked' : ''}`} key={c.label}>
          <div className="comp-opts">
            {c.options.map((o, oi) => {
              let cls = 'comp-opt';
              if (c.selected === oi) cls += ' on';
              if (revealed && c.correct === oi) cls += ' good';
              else if (revealed && c.selected === oi && c.correct !== oi) cls += ' bad';
              return (
                <button
                  key={o}
                  className={cls}
                  disabled={c.locked || revealed}
                  onClick={() => onPick(ci, oi)}
                >
                  <span className="comp-dot" />
                  {o}
                </button>
              );
            })}
          </div>
          <div className="comp-col-label">{c.label}</div>
        </div>
      ))}

      <div className="comp-col">
        <input
          className="comp-makeup"
          type="range"
          min={0}
          max={18}
          step={0.5}
          value={makeupDb}
          disabled={revealed}
          onChange={(e) => onMakeup(Number(e.target.value))}
        />
        <div className="comp-col-label">Makeup {makeupDb > 0 ? `+${makeupDb}` : '0'} dB</div>
      </div>

      <div className="comp-col">
        <div className="comp-gr">
          <div
            className="comp-gr-fill"
            style={{ height: `${Math.min(100, (grDb / 20) * 100)}%` }}
          />
        </div>
        <div className="comp-col-label">GR</div>
      </div>
    </div>
  );
}
