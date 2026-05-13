/**
 * Chord progression ear-training data.
 *
 * Unlike the "identify the progression by name" exercise (e.g. "that's a
 * I-V-vi-IV"), this exercise plays a randomly generated progression and
 * asks the user to identify each chord by Roman numeral, slot by slot.
 *
 * Each PROGRESSION_CHORD describes one chord in a major-key context —
 * the scale-degree it's built on, the intervals from that root, and the
 * Roman-numeral label. Levels expose progressively larger vocabularies.
 *
 * Progression generation: at runtime, the exercise picks 3-4 chords from
 * the level's allowed vocabulary, weighted so that the I chord starts
 * progressions more often (musical realism), and resolves to I or V
 * more often at the end. See progression.ts for the generation logic.
 */

export interface ProgressionChord {
  /** Roman-numeral id used in answers and feedback (e.g. 'I', 'ii', 'V7'). */
  id: string;
  /** Display label — same as id for now, but allows future styling. */
  n: string;
  /** Short label for compact buttons. */
  sh: string;
  /** Display color (matches the chord-quality colour from constants where possible). */
  co: string;
  /** Semitones above the key's tonic where this chord is rooted. */
  rootOffset: number;
  /** Chord intervals from that root. */
  iv: number[];
  /** Function family — used in feedback explanations. */
  fn: 'tonic' | 'subdominant' | 'dominant';
  /** One-line description of how this chord typically feels in the key. */
  ex: string;
}

// ─── Chord vocabulary in a major key ────────────────────────────────────────
// Colours roughly follow the constants.ts palette for consistency.

const TRIADS: ProgressionChord[] = [
  // ─── Tonic family ───
  { id: 'I',    n: 'I',    sh: 'I',    co: '#22c55e', rootOffset: 0,  iv: [0, 4, 7], fn: 'tonic',       ex: 'Home — fully resolved, settled' },
  { id: 'iii',  n: 'iii',  sh: 'iii',  co: '#4ade80', rootOffset: 4,  iv: [0, 3, 7], fn: 'tonic',       ex: 'Soft tonic — shares 2 notes with I (E-G), feels home-ish' },
  { id: 'vi',   n: 'vi',   sh: 'vi',   co: '#16a34a', rootOffset: 9,  iv: [0, 3, 7], fn: 'tonic',       ex: 'Relative-minor tonic — shares 2 notes with I, but darker' },
  // ─── Subdominant family ───
  { id: 'ii',   n: 'ii',   sh: 'ii',   co: '#60a5fa', rootOffset: 2,  iv: [0, 3, 7], fn: 'subdominant', ex: 'Softer subdominant — shares 2 notes with IV, often leads to V' },
  { id: 'IV',   n: 'IV',   sh: 'IV',   co: '#3b82f6', rootOffset: 5,  iv: [0, 4, 7], fn: 'subdominant', ex: 'Subdominant — open, "stepping away from home"' },
  // ─── Dominant family ───
  { id: 'V',    n: 'V',    sh: 'V',    co: '#f43f5e', rootOffset: 7,  iv: [0, 4, 7], fn: 'dominant',    ex: 'Dominant — restless, wants to resolve back to I' },
  { id: 'vii°', n: 'vii°', sh: 'vii°', co: '#dc2626', rootOffset: 11, iv: [0, 3, 6], fn: 'dominant',    ex: 'Leading-tone diminished — shares the tritone with V7, dominant-functioning' },
];

const SEVENTHS: ProgressionChord[] = [
  { id: 'Imaj7',  n: 'Imaj7',  sh: 'I△7',  co: '#06b6d4', rootOffset: 0, iv: [0, 4, 7, 11], fn: 'tonic',       ex: 'Major-7 tonic — dreamier home' },
  { id: 'ii7',    n: 'ii7',    sh: 'ii7',  co: '#8b5cf6', rootOffset: 2, iv: [0, 3, 7, 10], fn: 'subdominant', ex: 'Min7 subdominant — the jazz ii in ii-V-I' },
  { id: 'iii7',   n: 'iii7',   sh: 'iii7', co: '#a78bfa', rootOffset: 4, iv: [0, 3, 7, 10], fn: 'tonic',       ex: 'Min7 tonic substitute — silky' },
  { id: 'IVmaj7', n: 'IVmaj7', sh: 'IV△7', co: '#0ea5e9', rootOffset: 5, iv: [0, 4, 7, 11], fn: 'subdominant', ex: 'Major-7 subdominant — bossa-nova warm' },
  { id: 'V7',     n: 'V7',     sh: 'V7',   co: '#ef4444', rootOffset: 7, iv: [0, 4, 7, 10], fn: 'dominant',    ex: 'Dominant 7 — the restless engine of harmony' },
  { id: 'vi7',    n: 'vi7',    sh: 'vi7',  co: '#7c3aed', rootOffset: 9, iv: [0, 3, 7, 10], fn: 'tonic',       ex: 'Relative-minor 7 — soft, soulful' },
  { id: 'viiø7',  n: 'viiø7',  sh: 'vii⌀', co: '#b91c1c', rootOffset: 11, iv: [0, 3, 6, 10], fn: 'dominant',   ex: 'Half-dim 7 — shares tritone with V7, more colour' },
];

export const PROGRESSION_CHORDS: ProgressionChord[] = [...TRIADS, ...SEVENTHS];

// Look up by id — useful since exercises store id strings
export const PROGRESSION_CHORD_MAP: Record<string, ProgressionChord> =
  Object.fromEntries(PROGRESSION_CHORDS.map((c) => [c.id, c]));

// ─── Levels ────────────────────────────────────────────────────────────────
// Matches tonedear's pedagogy: Simple Triads → All Triads → Triads + 7ths.

export interface ProgressionLevel {
  n: string;
  /** Allowed chord ids for this level. */
  ch: string[];
  /** Min/max progression length (inclusive). */
  minLen: number;
  maxLen: number;
}

export const PROGRESSION_LEVELS: ProgressionLevel[] = [
  {
    n: 'Simple Triads',
    ch: ['I', 'IV', 'V'],
    minLen: 3, maxLen: 4,
  },
  {
    n: 'Pop Triads',
    ch: ['I', 'IV', 'V', 'vi'],
    minLen: 3, maxLen: 4,
  },
  {
    n: 'All Triads',
    ch: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    minLen: 3, maxLen: 4,
  },
  {
    n: 'Triads + 7ths',
    ch: ['I', 'Imaj7', 'ii', 'ii7', 'iii', 'iii7', 'IV', 'IVmaj7', 'V', 'V7', 'vi', 'vi7', 'vii°', 'viiø7'],
    minLen: 3, maxLen: 4,
  },
];
