/**
 * EqCurve — renders a biquad filter's magnitude response as an SVG curve
 * (the target curve in EQ Match). Display-only; see EqEditor for the
 * interactive version.
 */

import { useMemo } from 'react';
import { biquadPath } from './biquadPath';
import { fmtFreq } from '../scoring';

const W = 560;
const H = 150;
const DB_RANGE = 15; // ±15 dB vertical

export function EqCurve({
  type = 'peaking',
  freq,
  gainDb,
  q = 1.4,
}: {
  type?: BiquadFilterType;
  freq: number;
  gainDb: number;
  q?: number;
}) {
  const path = useMemo(
    () => biquadPath(type, freq, gainDb, q, W, H, DB_RANGE),
    [type, freq, gainDb, q],
  );

  return (
    <div className="studio-eqcurve">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} className="eq-zero" />
        <path d={path} className="eq-path" />
      </svg>
      <div className="studio-eqcurve-caption">
        {gainDb > 0 ? '+' : ''}{gainDb} dB @ {fmtFreq(freq)} · Q {q}
      </div>
    </div>
  );
}
