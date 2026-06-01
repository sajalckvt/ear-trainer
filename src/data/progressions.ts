/**
 * Chord progression ear-training data.
 */

export interface ProgressionChord {
  id: string;
  n: string;
  sh: string;
  co: string;
  rootOffset: number;
  iv: number[];
  fn: 'tonic' | 'subdominant' | 'dominant' | 'nondiatonic';
  ex: string;
}

// ─── Chord vocabulary in a major key ────────────────────────────────────────

const TRIADS: ProgressionChord[] = [
  { id: 'I',    n: 'I',    sh: 'I',    co: '#22c55e', rootOffset: 0,  iv: [0, 4, 7], fn: 'tonic',       ex: 'Home — fully resolved, settled' },
  { id: 'iii',  n: 'iii',  sh: 'iii',  co: '#4ade80', rootOffset: 4,  iv: [0, 3, 7], fn: 'tonic',       ex: 'Soft tonic — shares 2 notes with I (E-G), feels home-ish' },
  { id: 'vi',   n: 'vi',   sh: 'vi',   co: '#16a34a', rootOffset: 9,  iv: [0, 3, 7], fn: 'tonic',       ex: 'Relative-minor tonic — shares 2 notes with I, but darker' },
  { id: 'ii',   n: 'ii',   sh: 'ii',   co: '#60a5fa', rootOffset: 2,  iv: [0, 3, 7], fn: 'subdominant', ex: 'Softer subdominant — shares 2 notes with IV, often leads to V' },
  { id: 'IV',   n: 'IV',   sh: 'IV',   co: '#3b82f6', rootOffset: 5,  iv: [0, 4, 7], fn: 'subdominant', ex: 'Subdominant — open, "stepping away from home"' },
  { id: 'V',    n: 'V',    sh: 'V',    co: '#f43f5e', rootOffset: 7,  iv: [0, 4, 7], fn: 'dominant',    ex: 'Dominant — restless, wants to resolve back to I' },
  { id: 'vii°', n: 'vii°', sh: 'vii°', co: '#dc2626', rootOffset: 11, iv: [0, 3, 6], fn: 'dominant',    ex: 'Leading-tone diminished — shares the tritone with V7, dominant-functioning' },
];

const SEVENTHS: ProgressionChord[] = [
  { id: 'Imaj7',  n: 'Imaj7',  sh: 'I△7',  co: '#06b6d4', rootOffset: 0,  iv: [0, 4, 7, 11], fn: 'tonic',       ex: 'Major-7 tonic — dreamier home' },
  { id: 'ii7',    n: 'ii7',    sh: 'ii7',  co: '#8b5cf6', rootOffset: 2,  iv: [0, 3, 7, 10], fn: 'subdominant', ex: 'Min7 subdominant — the jazz ii in ii-V-I' },
  { id: 'iii7',   n: 'iii7',   sh: 'iii7', co: '#a78bfa', rootOffset: 4,  iv: [0, 3, 7, 10], fn: 'tonic',       ex: 'Min7 tonic substitute — silky' },
  { id: 'IVmaj7', n: 'IVmaj7', sh: 'IV△7', co: '#0ea5e9', rootOffset: 5,  iv: [0, 4, 7, 11], fn: 'subdominant', ex: 'Major-7 subdominant — bossa-nova warm' },
  { id: 'V7',     n: 'V7',     sh: 'V7',   co: '#ef4444', rootOffset: 7,  iv: [0, 4, 7, 10], fn: 'dominant',    ex: 'Dominant 7 — the restless engine of harmony' },
  { id: 'vi7',    n: 'vi7',    sh: 'vi7',  co: '#7c3aed', rootOffset: 9,  iv: [0, 3, 7, 10], fn: 'tonic',       ex: 'Relative-minor 7 — soft, soulful' },
  { id: 'viiø7',  n: 'viiø7',  sh: 'vii⌀', co: '#b91c1c', rootOffset: 11, iv: [0, 3, 6, 10], fn: 'dominant',    ex: 'Half-dim 7 — shares tritone with V7, more colour' },
];

// ─── Non-diatonic chords ──────────────────────────────────────────────────
// These borrow from parallel minor, other modes, or use secondary dominants.
// rootOffset is from the major-key tonic.

const NON_DIATONIC: ProgressionChord[] = [
  // Borrowed from parallel minor (modal interchange)
  { id: 'bVII',   n: '♭VII',  sh: '♭VII',  co: '#f97316', rootOffset: 10, iv: [0, 4, 7], fn: 'nondiatonic', ex: 'Borrowed from Mixolydian/minor — Beatles, classic rock staple' },
  { id: 'bVI',    n: '♭VI',   sh: '♭VI',   co: '#fb923c', rootOffset: 8,  iv: [0, 4, 7], fn: 'nondiatonic', ex: 'Borrowed from parallel minor — dark, cinematic, Aeolian flavor' },
  { id: 'bIII',   n: '♭III',  sh: '♭III',  co: '#fdba74', rootOffset: 3,  iv: [0, 4, 7], fn: 'nondiatonic', ex: 'Borrowed from parallel minor — warm, unexpected lift' },
  { id: 'iv',     n: 'iv',    sh: 'iv',    co: '#38bdf8', rootOffset: 5,  iv: [0, 3, 7], fn: 'nondiatonic', ex: 'Minor subdominant — borrowed, adds pathos (minor IV in major key)' },
  // Secondary dominants
  { id: 'V/V',    n: 'V/V',   sh: 'V/V',   co: '#f43f5e', rootOffset: 2,  iv: [0, 4, 7, 10], fn: 'nondiatonic', ex: 'Secondary dominant of V — II7, raises the 4th degree, creates extra pull' },
  { id: 'V/IV',   n: 'V/IV',  sh: 'V/IV',  co: '#fb7185', rootOffset: 0,  iv: [0, 4, 7, 10], fn: 'nondiatonic', ex: 'I chord made dominant — pivots the key temporarily toward IV' },
  { id: 'V/vi',   n: 'V/vi',  sh: 'V/vi',  co: '#f87171', rootOffset: 4,  iv: [0, 4, 7, 10], fn: 'nondiatonic', ex: 'Secondary dominant of vi — III7, cinematic, "Hollywood" chord' },
  // Neapolitan-adjacent / chromatic
  { id: 'bII',    n: '♭II',   sh: '♭II',   co: '#c084fc', rootOffset: 1,  iv: [0, 4, 7], fn: 'nondiatonic', ex: 'Neapolitan — flat-two major, flamenco / dramatic tension before V' },
];

// ─── 9th tension chords ──────────────────────────────────────────────────────
// Intervals: root=0, 3rd, 5th, 7th, 9th (9th = 14 semitones = maj2 + octave)
// We drop the 5th in most voicings (standard jazz practice) to keep range tight.
// rootOffset is from the major-key tonic.

const NINTHS: ProgressionChord[] = [
  { id: 'Imaj9',  n: 'Imaj9',  sh: 'I△9',  co: '#06b6d4', rootOffset: 0,  iv: [0, 4, 11, 14], fn: 'tonic',       ex: 'Tonic major 9 — lush, open, neo-soul / R&B staple' },
  { id: 'ii9',    n: 'ii9',    sh: 'ii9',  co: '#818cf8', rootOffset: 2,  iv: [0, 3, 10, 14], fn: 'subdominant', ex: 'Minor 9 subdominant — silky jazz ii chord' },
  { id: 'V9',     n: 'V9',     sh: 'V9',   co: '#f43f5e', rootOffset: 7,  iv: [0, 4, 10, 14], fn: 'dominant',    ex: 'Dominant 9 — full, warm tension; resolves strongly to I' },
  { id: 'V7b9',   n: 'V7♭9',  sh: 'V7♭9', co: '#dc2626', rootOffset: 7,  iv: [0, 4, 10, 13], fn: 'dominant',    ex: 'Dominant 7♭9 — Spanish/flamenco edge, intense pull to I' },
  { id: 'V7s9',   n: 'V7♯9',  sh: 'V7♯9', co: '#b91c1c', rootOffset: 7,  iv: [0, 4, 10, 15], fn: 'dominant',    ex: 'Dominant 7♯9 — the "Hendrix chord", blues-rock tension' },
  { id: 'IVmaj9', n: 'IVmaj9', sh: 'IV△9', co: '#0ea5e9', rootOffset: 5,  iv: [0, 4, 11, 14], fn: 'subdominant', ex: 'Major 9 subdominant — bossa nova warmth' },
  { id: 'vi9',    n: 'vi9',    sh: 'vi9',  co: '#7c3aed', rootOffset: 9,  iv: [0, 3, 10, 14], fn: 'tonic',       ex: 'Minor 9 — melancholic, neo-soul relative minor' },
];

export const PROGRESSION_CHORDS: ProgressionChord[] = [...TRIADS, ...SEVENTHS, ...NON_DIATONIC, ...NINTHS];

export const PROGRESSION_CHORD_MAP: Record<string, ProgressionChord> =
  Object.fromEntries(PROGRESSION_CHORDS.map((c) => [c.id, c]));

export interface ProgressionLevel {
  n: string;
  /** short description shown in the UI */
  desc?: string;
  /** For random levels: allowed chord ids */
  ch?: string[];
  /** Min/max progression length (inclusive). 'random' = exercise default */
  minLen: number;
  maxLen: number;
  /** If true, includes non-diatonic chords */
  isNonDiatonic?: boolean;
  /** filter songs to only those with hasNonDiatonic */
  nonDiatonicOnly?: boolean;
}

export const PROGRESSION_LEVELS: ProgressionLevel[] = [
  {
    n: 'Simple Triads',
    desc: 'I, IV, V',
    ch: ['I', 'IV', 'V'],
    minLen: 3, maxLen: 4,
  },
  {
    n: 'Pop Triads',
    desc: 'I, IV, V, vi',
    ch: ['I', 'IV', 'V', 'vi'],
    minLen: 3, maxLen: 4,
  },
  {
    n: 'All Triads',
    desc: 'All 7 diatonic triads',
    ch: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    minLen: 3, maxLen: 5,
  },
  {
    n: 'Triads + Primary 7ths',
    desc: 'Triads plus V7, Imaj7, IVmaj7',
    ch: ['I', 'Imaj7', 'ii', 'iii', 'IV', 'IVmaj7', 'V', 'V7', 'vi', 'vii°'],
    minLen: 3, maxLen: 5,
  },
  {
    n: 'Triads + All 7ths',
    desc: 'Full diatonic palette',
    ch: ['I', 'Imaj7', 'ii', 'ii7', 'iii', 'iii7', 'IV', 'IVmaj7', 'V', 'V7', 'vi', 'vi7', 'vii°', 'viiø7'],
    minLen: 3, maxLen: 5,
  },
  {
    n: 'Non-Diatonic',
    desc: 'Borrowed & chromatic',
    isNonDiatonic: true,
    ch: ['I', 'IV', 'V', 'vi', 'bVII', 'bVI', 'bIII', 'iv', 'V/V', 'V/IV', 'V/vi', 'bII'],
    minLen: 3, maxLen: 5,
  },
  {
    n: '9th Tensions',
    desc: 'maj9, dom9, ♭9, ♯9',
    ch: ['Imaj9', 'ii9', 'IVmaj9', 'V9', 'V7b9', 'V7s9', 'vi9',
         'Imaj7', 'ii7', 'IVmaj7', 'V7', 'vi7'],
    minLen: 3, maxLen: 5,
  },
];
