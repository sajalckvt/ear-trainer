/**
 * EqEditor — interactive EQ graph for EQ Copy. Drag the node to set
 * frequency (x) and, when enabled, gain (y). Q gets a slider below.
 * On reveal, the target curve is drawn dashed over yours.
 */

import { useMemo, useRef, type PointerEvent } from 'react';
import { biquadPath } from './biquadPath';
import { freqToPos, posToFreq, fmtFreq } from '../scoring';

const W = 560;
const H = 190;
const DB = 15; // ±15 dB vertical

export interface EqValue {
  freq: number;
  gainDb: number;
  q: number;
}

const FREQ_TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

// Q slider: 0..1 → 0.3..8 (log)
export const sliderToQ = (v: number) => Math.round(0.3 * Math.pow(8 / 0.3, v) * 10) / 10;
export const qToSlider = (q: number) => Math.log(q / 0.3) / Math.log(8 / 0.3);

export function EqEditor({
  type,
  value,
  onChange,
  adjustGain,
  adjustQ,
  target,
  disabled,
}: {
  type: BiquadFilterType;
  value: EqValue;
  onChange: (v: EqValue) => void;
  adjustGain: boolean;
  adjustQ: boolean;
  /** When set, draws the target curve dashed (reveal). */
  target?: EqValue | null;
  disabled?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef(false);

  const yourPath = useMemo(
    () => biquadPath(type, value.freq, value.gainDb, value.q, W, H, DB),
    [type, value.freq, value.gainDb, value.q],
  );
  const targetPath = useMemo(
    () => (target ? biquadPath(type, target.freq, target.gainDb, target.q, W, H, DB) : ''),
    [type, target],
  );

  const interactive = !disabled && !target;

  const applyPointer = (e: PointerEvent<SVGSVGElement>) => {
    const r = svgRef.current!.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const freq = Math.round(posToFreq(px));
    const gainDb = adjustGain
      ? Math.round((0.5 - py) * 2 * DB * 10) / 10
      : value.gainDb;
    onChange({ ...value, freq, gainDb: Math.min(12, Math.max(-12, gainDb)) });
  };

  const nodeX = freqToPos(value.freq) * W;
  const nodeY = adjustGain ? H / 2 - (value.gainDb / DB) * (H / 2) : H / 2;

  return (
    <div className="studio-eqeditor">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={interactive ? 'interactive' : ''}
        onPointerDown={interactive ? (e) => {
          dragRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          applyPointer(e);
        } : undefined}
        onPointerMove={interactive ? (e) => { if (dragRef.current) applyPointer(e); } : undefined}
        onPointerUp={interactive ? () => { dragRef.current = false; } : undefined}
      >
        {/* grid */}
        {FREQ_TICKS.map((hz) => (
          <line
            key={hz}
            x1={freqToPos(hz) * W} y1={0} x2={freqToPos(hz) * W} y2={H}
            className="eq-grid"
          />
        ))}
        {[-12, -6, 6, 12].map((db) => (
          <line
            key={db}
            x1={0} y1={H / 2 - (db / DB) * (H / 2)} x2={W} y2={H / 2 - (db / DB) * (H / 2)}
            className="eq-grid"
          />
        ))}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} className="eq-zero" />

        {target && <path d={targetPath} className="eq-path-target" />}
        <path d={yourPath} className="eq-path" />
        <circle cx={nodeX} cy={nodeY} r={9} className="eq-node" />
      </svg>

      <div className="studio-eqeditor-ticks">
        {FREQ_TICKS.map((hz) => (
          <span key={hz} style={{ left: `${freqToPos(hz) * 100}%` }}>{fmtFreq(hz)}</span>
        ))}
      </div>

      <div className="studio-eqeditor-readout">
        {fmtFreq(value.freq)}
        {adjustGain && <> · {value.gainDb > 0 ? '+' : ''}{value.gainDb} dB</>}
        {adjustQ && <> · Q {value.q}</>}
      </div>

      {adjustQ && (
        <div className="studio-eqeditor-q">
          <span>Q</span>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={qToSlider(value.q)}
            disabled={!interactive}
            onChange={(e) => onChange({ ...value, q: sliderToQ(Number(e.target.value)) })}
          />
          <span>{value.q}</span>
        </div>
      )}
    </div>
  );
}
