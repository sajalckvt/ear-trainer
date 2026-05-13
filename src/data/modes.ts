/**
 * Mode definitions for the modal-harmony exercise.
 *
 * Each mode is defined by:
 * - Its scale intervals (from the tonic)
 * - A "diagnostic chord pair" — the two chords that most clearly
 *   distinguish this mode from its neighbours. The exercise plays
 *   the tonic chord followed by the diagnostic chord, and the user
 *   identifies which mode they're hearing.
 * - Song mnemonics with optional playable phrases
 * - The signature note that differentiates it from the "default"
 *   major or minor scale
 *
 * All chord voicings are relative to a key root. At runtime the
 * exercise picks a random root, builds the tonic + diagnostic chord,
 * and plays them.
 */

import type { SongRef } from './constants';

export interface ModeChord {
  /** Semitone offset from the mode's tonic. */
  rootOffset: number;
  /** Chord intervals from that root. */
  iv: number[];
  /** Roman-numeral label. */
  rn: string;
}

export interface ModeDefinition {
  id: string;
  /** Full name (e.g. "Dorian"). */
  n: string;
  /** Short label for buttons. */
  sh: string;
  /** Display color. */
  co: string;
  /** Scale intervals from tonic (ascending). */
  scale: number[];
  /** Is the tonic chord major or minor? */
  tonality: 'major' | 'minor' | 'diminished';
  /** The tonic chord (i or I or i°). */
  tonic: ModeChord;
  /** The diagnostic chord — the one that "gives it away". */
  diagnostic: ModeChord;
  /** The signature note(s) that differentiate this mode. */
  signature: string;
  /** One-liner on the mode's flavour. */
  ex: string;
  /** Harmonic hint — the chord-pair rule for quick identification. */
  hint: string;
  /** Song mnemonics. */
  songs: SongRef[];
}

const MAJ = [0, 4, 7];
const MIN = [0, 3, 7];
const DIM = [0, 3, 6];

export const MODES: ModeDefinition[] = [
  {
    id: 'ionian', n: 'Ionian (Major)', sh: 'Ion', co: '#22c55e',
    scale: [0, 2, 4, 5, 7, 9, 11],
    tonality: 'major',
    tonic:      { rootOffset: 0, iv: MAJ, rn: 'I' },
    diagnostic: { rootOffset: 7, iv: MAJ, rn: 'V' },
    signature: 'Natural 4, natural 7 — the standard major scale',
    ex: 'Bright, resolved, "normal" major — the default happy sound',
    hint: 'If the tonic is major and the V chord is major → Ionian. The vanilla major key.',
    songs: [
      {
        title: '"Twinkle Twinkle Little Star"',
        hint: 'Pure Ionian — I-I-V-V-vi-vi-V in the most basic major key',
        phrase: [0, 0, 7, 7, 9, 9, 7],
        bpm: 130,
      },
      {
        title: '"Let It Be" — Beatles',
        hint: 'C major throughout — the textbook Ionian anthem',
      },
      {
        title: '"Happy Birthday"',
        hint: 'The most universal major-key melody in the world',
        phrase: [0, 0, 2, 0, 5, 4],
        bpm: 100,
      },
    ],
  },
  {
    id: 'dorian', n: 'Dorian', sh: 'Dor', co: '#8b5cf6',
    scale: [0, 2, 3, 5, 7, 9, 10],
    tonality: 'minor',
    tonic:      { rootOffset: 0, iv: MIN, rn: 'i' },
    diagnostic: { rootOffset: 5, iv: MAJ, rn: 'IV' },
    signature: 'Natural 6 in a minor key — the one bright note',
    ex: 'Minor but with a warm glow — jazzy, funky, not fully sad',
    hint: 'If 1 is minor and 4 is MAJOR → Dorian. The major IV is the giveaway.',
    songs: [
      {
        title: '"Mad World" — Tears for Fears',
        hint: 'Em → A (= i → IV major) — the Dorian lift in a melancholy song',
        phrase: [0, 3, 7, 12, 10, 7, 3],
        bpm: 90,
      },
      {
        title: '"Get Lucky" — Daft Punk',
        hint: 'Bm → D → F♯m → E (i → ♭III → v → IV) — the IV (E major) is Dorian',
        phrase: [0, 3, 7, 10, 7, 3, 0],
        bpm: 116,
      },
      {
        title: '"Stayin\' Alive" — Bee Gees',
        hint: 'Fm → B♭ — the major IV (B♭) over a minor tonic = Dorian funk',
        phrase: [0, 3, 5, 7, 10, 7, 5, 3],
        bpm: 104,
      },
    ],
  },
  {
    id: 'phrygian', n: 'Phrygian', sh: 'Phr', co: '#ef4444',
    scale: [0, 1, 3, 5, 7, 8, 10],
    tonality: 'minor',
    tonic:      { rootOffset: 0, iv: MIN, rn: 'i' },
    diagnostic: { rootOffset: 1, iv: MAJ, rn: '♭II' },
    signature: '♭2 — the half-step above the root, Spanish/exotic flavour',
    ex: 'Dark, exotic, menacing — the flamenco / metal mode',
    hint: 'If 1 is minor and there\'s a MAJOR chord one semitone up (♭II) → Phrygian.',
    songs: [
      {
        title: '"HUMBLE." — Kendrick Lamar',
        hint: 'The piano melody hammers the ♭2 — Phrygian aggression',
        phrase: [0, 1, 3, 0, 1, 0],
        bpm: 150,
      },
      {
        title: '"Pyramid Song" — Radiohead',
        hint: 'F♯ → Gmaj7 (= i → ♭II) — the half-step-up major chord is pure Phrygian',
        phrase: [0, 1, 3, 5, 3, 1, 0],
        bpm: 80,
      },
      {
        title: '"White Rabbit" — Jefferson Airplane',
        hint: 'The slow march builds on i → ♭II — hypnotic Phrygian ascent',
        phrase: [0, 1, 3, 5, 7, 8, 7, 5],
        bpm: 110,
      },
    ],
  },
  {
    id: 'lydian', n: 'Lydian', sh: 'Lyd', co: '#06b6d4',
    scale: [0, 2, 4, 6, 7, 9, 11],
    tonality: 'major',
    tonic:      { rootOffset: 0, iv: MAJ, rn: 'I' },
    diagnostic: { rootOffset: 2, iv: MAJ, rn: 'II' },
    signature: '♯4 (tritone from root) — the "floating" note',
    ex: 'Dreamy, ethereal, hopeful — sounds like it\'s lifting off the ground',
    hint: 'If I is major and II is ALSO major → Lydian. The raised 4th floats above the normal major.',
    songs: [
      {
        title: '"Maria" — West Side Story',
        hint: 'The opening "Ma-RI-a" leaps a tritone (♯4) — the Lydian signature interval',
        phrase: [0, 6, 7, 6, 7],
        bpm: 80,
      },
      {
        title: '"Jane Says" — Jane\'s Addiction',
        hint: 'G → A loop (= I → II) — the major II is Lydian\'s calling card',
        phrase: [0, 2, 4, 6, 7, 4, 2],
        bpm: 100,
      },
      {
        title: '"Teenage Dream" — Katy Perry',
        hint: 'E♭ Lydian — the chords avoid the tonic and float on I → II',
        phrase: [0, 4, 6, 7, 6, 4, 0],
        bpm: 120,
      },
    ],
  },
  {
    id: 'mixolydian', n: 'Mixolydian', sh: 'Mix', co: '#f97316',
    scale: [0, 2, 4, 5, 7, 9, 10],
    tonality: 'major',
    tonic:      { rootOffset: 0, iv: MAJ, rn: 'I' },
    diagnostic: { rootOffset: 10, iv: MAJ, rn: '♭VII' },
    signature: '♭7 — major scale with a flat 7, the bluesy rock mode',
    ex: 'Major but with a bluesy, rock edge — dom7 lives here',
    hint: 'If I is major and there\'s a major chord on ♭VII → Mixolydian. The ♭VII is the giveaway.',
    songs: [
      {
        title: '"Royals" — Lorde',
        hint: 'D → C → G (= I → ♭VII → IV) — the ♭VII (C major) is Mixolydian',
        phrase: [0, 2, 4, 7, 4, 2, 0],
        bpm: 85,
      },
      {
        title: '"Sweet Child O\' Mine" — Guns N\' Roses',
        hint: 'D → C → G — same I → ♭VII → IV Mixolydian move',
        phrase: [0, 7, 9, 7, 4, 0, 4, 7],
        bpm: 120,
      },
      {
        title: '"Norwegian Wood" — Beatles',
        hint: 'E Mixolydian — the ♭7 (D natural) gives it the folk-rock flavour',
        phrase: [0, 2, 4, 5, 4, 2, 0],
        bpm: 100,
      },
    ],
  },
  {
    id: 'aeolian', n: 'Aeolian (Natural Minor)', sh: 'Aeo', co: '#3b82f6',
    scale: [0, 2, 3, 5, 7, 8, 10],
    tonality: 'minor',
    tonic:      { rootOffset: 0, iv: MIN, rn: 'i' },
    diagnostic: { rootOffset: 8, iv: MAJ, rn: '♭VI' },
    signature: '♭6 and ♭7 — the "plain" minor scale, no bright notes',
    ex: 'Dark, sad, straightforward minor — the default minor key',
    hint: 'If 1 is minor and 4 is also MINOR → likely Aeolian (not Dorian). The ♭VI major chord is typical.',
    songs: [
      {
        title: '"Losing My Religion" — R.E.M.',
        hint: 'Am throughout — textbook natural minor / Aeolian',
        phrase: [0, 3, 5, 7, 8, 7, 5, 3],
        bpm: 126,
      },
      {
        title: '"Stairway to Heaven" — Led Zeppelin (verse)',
        hint: 'Am — the verse is pure Aeolian before the chromatic descent',
        phrase: [0, 3, 7, 12, 10, 8, 7],
        bpm: 72,
      },
      {
        title: '"All Along the Watchtower" — Bob Dylan / Hendrix',
        hint: 'Am → G → F → G (= i → ♭VII → ♭VI → ♭VII) — Aeolian loop',
        phrase: [0, 7, 10, 7, 3, 0],
        bpm: 110,
      },
    ],
  },
  {
    id: 'locrian', n: 'Locrian', sh: 'Loc', co: '#dc2626',
    scale: [0, 1, 3, 5, 6, 8, 10],
    tonality: 'diminished',
    tonic:      { rootOffset: 0, iv: DIM, rn: 'i°' },
    diagnostic: { rootOffset: 1, iv: MAJ, rn: '♭II' },
    signature: '♭2 AND ♭5 (tritone in the tonic chord) — the most unstable mode',
    ex: 'Extremely dark, unstable, almost unusable — the tritone lives in the tonic itself',
    hint: 'If the tonic chord is DIMINISHED and ♭II is major → Locrian. Extremely rare in real music.',
    songs: [
      {
        title: '"Army of Me" — Björk',
        hint: 'The grinding bass riff outlines the tritone in the tonic — Locrian menace',
        phrase: [0, 1, 3, 6, 3, 1, 0],
        bpm: 100,
      },
      {
        title: 'Dust to Dust — movie trailer tension',
        hint: 'Locrian is the "everything is falling apart" mode — used for dread',
        phrase: [0, 6, 5, 3, 1, 0],
        bpm: 70,
      },
    ],
  },
];

export const MODE_MAP: Record<string, ModeDefinition> =
  Object.fromEntries(MODES.map((m) => [m.id, m]));

// ─── Levels ────────────────────────────────────────────────────────────────

export interface ModeLevel {
  n: string;
  /** Mode ids available at this level. */
  modes: string[];
}

export const MODE_LEVELS: ModeLevel[] = [
  { n: 'Major vs Minor', modes: ['ionian', 'aeolian'] },
  { n: 'Bright modes',   modes: ['ionian', 'lydian', 'mixolydian'] },
  { n: 'Dark modes',     modes: ['aeolian', 'dorian', 'phrygian'] },
  { n: 'All 6 modes',    modes: ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian'] },
  { n: 'Expert',         modes: ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'] },
];

// ─── Close pairs for hint system ───────────────────────────────────────────

export const MODE_CLOSE_PAIRS = new Set([
  'ionian_lydian', 'lydian_ionian',
  'ionian_mixolydian', 'mixolydian_ionian',
  'aeolian_dorian', 'dorian_aeolian',
  'aeolian_phrygian', 'phrygian_aeolian',
  'phrygian_locrian', 'locrian_phrygian',
]);

export const MODE_HINTS: Record<string, string> = {
  'ionian_lydian':      'Close! Both are major. Lydian has a ♯4 (raised 4th) — does the II chord sound major? That\'s Lydian.',
  'lydian_ionian':      'Close! Both are major. Ionian has a natural 4 — the II chord would be minor, not major.',
  'ionian_mixolydian':  'Close! Both are major. Mixolydian has a ♭7 — listen for the ♭VII major chord.',
  'mixolydian_ionian':  'Close! Both are major. Ionian has a natural 7 — the VII chord is diminished, not major.',
  'aeolian_dorian':     'Close! Both are minor. Dorian has a natural 6 — the IV chord is MAJOR. If the IV is minor → Aeolian.',
  'dorian_aeolian':     'Close! Both are minor. Aeolian has a ♭6 — the IV chord is minor. If it\'s major → Dorian.',
  'aeolian_phrygian':   'Close! Both are minor. Phrygian has a ♭2 — listen for the ♭II major chord, one semitone above the root.',
  'phrygian_aeolian':   'Close! Both are minor. Aeolian has a natural 2 — no ♭II chord lurking one fret up.',
  'phrygian_locrian':   'Close! Both have a ♭2. But Locrian\'s tonic chord is diminished (tritone in the root chord).',
  'locrian_phrygian':   'Close! Both have a ♭2. But Phrygian\'s tonic is a regular minor chord, not diminished.',
};
