/**
 * CAGED chord shapes for the guitar fretboard.
 *
 * Each of the five shapes (C, A, G, E, D) is a fixed fingering template.
 * We store, for the OPEN-position reference chord of that shape, the fret
 * played on each string (low E → high e), where -1 = muted/unplayed, plus
 * which string + fret holds the chord ROOT.
 *
 * To play any major chord with a shape, we shift every fret by the same
 * offset so the shape's root lands on the target pitch class. A shape whose
 * shifted frets would go negative is moved up an octave (12 frets).
 *
 * Strings are indexed 0..5 = low E, A, D, G, B, high e (matching GS reversed:
 * GS is high-e first, so we map carefully in the consumer).
 */

export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D';

export interface ShapeTemplate {
  shape: CagedShape;
  /** fret per string, index 0..5 = low E, A, D, G, B, high e; -1 = muted */
  frets: number[];
  /** string index (0..5, low E → high e) that holds the lowest root */
  rootString: number;
}

// Open-position reference shapes (the actual open chords they're named after).
// low E, A, D, G, B, high e
const TEMPLATES: Record<CagedShape, ShapeTemplate> = {
  // Open C major: x 3 2 0 1 0 — root C on the A string, 3rd fret
  C: { shape: 'C', frets: [-1, 3, 2, 0, 1, 0], rootString: 1 },
  // Open A major: x 0 2 2 2 0 — root A on the A string, open
  A: { shape: 'A', frets: [-1, 0, 2, 2, 2, 0], rootString: 1 },
  // Open G major: 3 2 0 0 0 3 — root G on the low E string, 3rd fret
  G: { shape: 'G', frets: [3, 2, 0, 0, 0, 3], rootString: 0 },
  // Open E major: 0 2 2 1 0 0 — root E on the low E string, open
  E: { shape: 'E', frets: [0, 2, 2, 1, 0, 0], rootString: 0 },
  // Open D major: x x 0 2 3 2 — root D on the D string, open
  D: { shape: 'D', frets: [-1, -1, 0, 2, 3, 2], rootString: 2 },
};

// MIDI of each open string, low E → high e (mirrors GS but low-to-high).
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];

// The cycle order, as shapes ascend the neck.
export const CAGED_ORDER: CagedShape[] = ['C', 'A', 'G', 'E', 'D'];

export interface ResolvedShape {
  shape: CagedShape;
  /** fret per string (low E → high e); -1 = muted */
  frets: number[];
  /** semitone shift applied from the template */
  baseFret: number;
}

/**
 * Resolve a CAGED shape for a target root pitch-class (0..11, C=0).
 * Returns the transposed frets, kept within a sensible neck window (0..15).
 */
export function resolveShape(shape: CagedShape, rootPc: number): ResolvedShape {
  const t = TEMPLATES[shape];
  // Pitch class of the template's root as written (open reference chord).
  const templateRootMidi = OPEN_STRING_MIDI[t.rootString] + t.frets[t.rootString];
  const templateRootPc = ((templateRootMidi % 12) + 12) % 12;
  // Semitone shift to move template root → target root, smallest non-negative.
  let shift = ((rootPc - templateRootPc) % 12 + 12) % 12;

  // Apply shift; if any *played* string would go below fret 0, bump octave.
  const apply = (sh: number) => t.frets.map((f) => (f < 0 ? -1 : f + sh));
  let frets = apply(shift);
  const minPlayed = Math.min(...frets.filter((f) => f >= 0));
  if (minPlayed < 0) { shift += 12; frets = apply(shift); }

  // If the whole shape sits very high (root above fret 12), and an octave
  // lower still fits on the neck (>= 0), prefer the lower position.
  if (shift >= 12) {
    const lower = apply(shift - 12);
    if (lower.filter((f) => f >= 0).every((f) => f >= 0)) {
      const lowMin = Math.min(...lower.filter((f) => f >= 0));
      if (lowMin >= 0) { shift -= 12; frets = lower; }
    }
  }

  return { shape, frets, baseFret: shift };
}

/**
 * Resolve all five shapes for a root, sorted by neck position (ascending),
 * so cycling moves up the neck naturally.
 */
export function resolveAllShapes(rootPc: number): ResolvedShape[] {
  return CAGED_ORDER
    .map((s) => resolveShape(s, rootPc))
    .sort((a, b) => {
      const am = Math.min(...a.frets.filter((f) => f >= 0));
      const bm = Math.min(...b.frets.filter((f) => f >= 0));
      return am - bm;
    });
}
