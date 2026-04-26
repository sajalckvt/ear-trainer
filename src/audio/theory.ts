import { NN, ND } from '../data/constants';

/** MIDI note number → flat-preferred note name (e.g., 60 → "C4") */
export function m2n(m: number): string {
  return NN[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
}

/** MIDI note number → sharp-preferred note name (e.g., 61 → "C#4") */
export function m2d(m: number): string {
  return ND[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
}

/** Key letter (e.g., "C", "F#") → MIDI offset within an octave (0-11) */
export function keyToOffset(key: string): number {
  const idx = NN.indexOf(key as typeof NN[number]);
  return idx >= 0 ? idx : 0;
}
