/**
 * biquadPath — SVG path for a biquad filter's magnitude response, computed
 * with the browser's own getFrequencyResponse (drawing always matches audio).
 * Shared by EqCurve (display) and EqEditor (interactive).
 */

import { ensureCtx } from '../../audio/engine';
import { FREQ_MIN, FREQ_MAX } from '../scoring';

export function biquadPath(
  type: BiquadFilterType,
  freq: number,
  gainDb: number,
  q: number,
  w: number,
  h: number,
  dbRange: number,
  n = 128,
): string {
  const ctx = ensureCtx();
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.gain.value = gainDb;
  f.Q.value = q;

  const freqs = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    freqs[i] = FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, i / (n - 1));
  }
  const mag = new Float32Array(n);
  const phase = new Float32Array(n);
  f.getFrequencyResponse(freqs, mag, phase);

  let d = '';
  for (let i = 0; i < n; i++) {
    const db = 20 * Math.log10(Math.max(mag[i], 1e-6));
    const x = (i / (n - 1)) * w;
    const y = h / 2 - (db / dbRange) * (h / 2);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${Math.min(h, Math.max(0, y)).toFixed(1)} `;
  }
  return d;
}
