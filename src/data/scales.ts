/**
 * Scale definitions for the scale-identification exercise.
 *
 * Each scale is defined by its interval pattern (semitone steps from root,
 * ascending), a one-liner on its sound, a song mnemonic, and a "signature"
 * note/interval that distinguishes it from its nearest neighbour.
 *
 * The exercise plays the scale ascending then descending (like TonedEar)
 * from a random root, and the user identifies which scale they heard.
 */

export interface ScaleDef {
  id: string;
  /** Full display name. */
  n: string;
  /** Short button label. */
  sh: string;
  /** Display color. */
  co: string;
  /**
   * Semitone offsets from root (ascending), NOT including the final octave.
   * e.g. Major = [0, 2, 4, 5, 7, 9, 11]
   */
  intervals: number[];
  /** One-liner feel. */
  ex: string;
  /** The one note/interval that distinguishes it from its neighbours. */
  signature: string;
  /** Rule of thumb for recognition. */
  hint: string;
  /** Song references (title + hint). */
  songs: Array<{ title: string; hint: string }>;
}

export const SCALES: ScaleDef[] = [
  // ─── Foundation ──────────────────────────────────────────────────────────
  {
    id: 'major',
    n: 'Major', sh: 'Maj', co: '#22c55e',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    ex: 'Bright, resolved, "normal" — the default happy sound',
    signature: 'Natural 4 and natural 7 (W-W-H-W-W-W-H)',
    hint: 'Sounds finished and bright. The 7th note is very close to the octave — a leading tone that pulls home.',
    songs: [
      { title: '"Twinkle Twinkle Little Star"', hint: 'The opening 6 notes are a pure major scale walk' },
      { title: '"Do-Re-Mi" — Sound of Music', hint: 'Literally a major scale with syllables' },
    ],
  },
  {
    id: 'naturalMinor',
    n: 'Natural Minor', sh: 'Min', co: '#3b82f6',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    ex: 'Dark, sad, "normal minor" — the default minor scale (Aeolian mode)',
    signature: '♭3, ♭6, ♭7 — three lowered notes vs major',
    hint: 'Sounds sad/dark. The 7th note is far from the octave — no leading-tone pull, which is why it sounds unresolved.',
    songs: [
      { title: '"Greensleeves" (traditional)', hint: 'The opening descent is natural minor — melancholy without tension' },
      { title: '"Stairway to Heaven" intro — Led Zeppelin', hint: 'The Am arpeggio runs through natural minor' },
    ],
  },
  {
    id: 'pentatonicMajor',
    n: 'Pentatonic Major', sh: 'Pent+', co: '#16a34a',
    intervals: [0, 2, 4, 7, 9],
    ex: '5-note subset of major — open, folksy, universally recognisable',
    signature: 'Only 5 notes — the 4th and 7th are missing (the "tension" notes)',
    hint: 'Sounds open and never dissonant. You can\'t play a wrong note in the key — removing the 4th and 7th removes all half-step tension.',
    songs: [
      { title: '"My Girl" — The Temptations (opening riff)', hint: 'The iconic major pentatonic melody' },
      { title: '"Happy Birthday"', hint: 'The melody uses only major pentatonic notes' },
    ],
  },
  {
    id: 'pentatonicMinor',
    n: 'Pentatonic Minor', sh: 'Pent−', co: '#1d4ed8',
    intervals: [0, 3, 5, 7, 10],
    ex: '5-note subset of minor — blues, rock, everywhere in guitar solos',
    signature: 'Only 5 notes — minor with no 2nd or 6th',
    hint: 'The backbone of rock and blues guitar solos. Sounds effortlessly cool. Every classic rock solo uses this scale.',
    songs: [
      { title: '"Smoke on the Water" riff — Deep Purple', hint: 'The guitar riff traces minor pentatonic' },
      { title: '"Back in Black" — AC/DC', hint: 'The intro riff is pure minor pentatonic' },
    ],
  },

  // ─── Minor flavours ───────────────────────────────────────────────────────
  {
    id: 'harmonicMinor',
    n: 'Harmonic Minor', sh: 'HMin', co: '#7c3aed',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    ex: 'Natural minor with a raised 7 — dramatic, Middle-Eastern, classical tension',
    signature: 'The augmented 2nd (m3 gap) between ♭6 and major 7 — a 3-semitone step, very distinctive',
    hint: 'That "exotic" leap between the 6th and 7th notes is the giveaway. It creates a strong pull back to the root — which is why it\'s called "harmonic" minor.',
    songs: [
      { title: '"Hava Nagila" (Jewish folk)', hint: 'The most famous harmonic minor melody — hear that exotic leap' },
      { title: '"Smooth Criminal" — Michael Jackson', hint: 'The violin melody outlines harmonic minor' },
    ],
  },
  {
    id: 'dorian',
    n: 'Dorian', sh: 'Dor', co: '#8b5cf6',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    ex: 'Natural minor with a raised 6 — jazzy, warm, funky minor',
    signature: 'Natural 6 (vs ♭6 in natural minor) — the one bright note in an otherwise dark scale',
    hint: 'Sounds like natural minor but with a brighter, warmer 6th note. The scale has a symmetrical structure — same intervals going up as down.',
    songs: [
      { title: '"Scarborough Fair" — Simon & Garfunkel', hint: 'Classic Dorian folk melody — the raised 6 gives it that modal tang' },
      { title: '"Mad World" — Tears for Fears', hint: 'The verse melody outlines Dorian minor with that characteristic natural 6' },
    ],
  },
  {
    id: 'phrygian',
    n: 'Phrygian', sh: 'Phr', co: '#ef4444',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    ex: 'Natural minor with a ♭2 — Spanish, flamenco, dark and exotic',
    signature: 'The ♭2 — a half-step above the root, creating an immediate dark clash',
    hint: 'The very first step down the scale is only a half-step — this creates that signature Spanish/exotic tension right away.',
    songs: [
      { title: '"White Rabbit" — Jefferson Airplane', hint: 'The ascending melody outlines Phrygian — that half-step first note' },
      { title: '"HUMBLE." — Kendrick Lamar', hint: 'The piano melody hammers the ♭2 — Phrygian aggression' },
    ],
  },

  // ─── Major flavours ───────────────────────────────────────────────────────
  {
    id: 'lydian',
    n: 'Lydian', sh: 'Lyd', co: '#06b6d4',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    ex: 'Major with a ♯4 — dreamy, floating, ethereal',
    signature: 'The ♯4 (tritone above root) — a raised 4th that makes the scale float',
    hint: 'Sounds like major but dreamier. When you hit the 4th note it\'s a half-step higher than expected — that surprise is the Lydian "lift".',
    songs: [
      { title: '"Maria" — West Side Story (opening leap)', hint: 'The "Ma-RI-a" leap outlines the tritone (♯4)' },
      { title: '"Jane Says" — Jane\'s Addiction', hint: 'The G → A chord loop is pure Lydian I → II' },
    ],
  },
  {
    id: 'mixolydian',
    n: 'Mixolydian', sh: 'Mix', co: '#f97316',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    ex: 'Major with a ♭7 — bluesy, rock, the "dominant" scale',
    signature: 'The ♭7 — major scale but the 7th note is lowered, no leading tone',
    hint: 'Sounds like major but with a bluesy, unresolved edge. The 7th note doesn\'t pull back to the root as strongly — it just hangs there.',
    songs: [
      { title: '"Royals" — Lorde', hint: 'D → C → G (I → ♭VII → IV) — the ♭7 (C natural in D) is Mixolydian' },
      { title: '"Norwegian Wood" — Beatles', hint: 'The verse runs through E Mixolydian — natural D over an E tonic' },
    ],
  },

  // ─── All modes ────────────────────────────────────────────────────────────
  // Ionian = major, Aeolian = naturalMinor (already above)
  {
    id: 'locrian',
    n: 'Locrian', sh: 'Loc', co: '#dc2626',
    intervals: [0, 1, 3, 5, 6, 8, 10],
    ex: 'The most unstable mode — minor with BOTH ♭2 and ♭5',
    signature: '♭2 AND ♭5 (tritone from root) — the tonic chord itself is diminished',
    hint: 'Sounds completely unstable — like everything wants to collapse. The root chord is diminished, so there\'s no safe resting point.',
    songs: [
      { title: '"Army of Me" — Björk', hint: 'The grinding riff outlines Locrian\'s unstable tritone' },
      { title: 'Film scores for "everything is falling apart"', hint: 'Horror and thriller composers reach for Locrian when they need maximum dread' },
    ],
  },

  // ─── Exotic ───────────────────────────────────────────────────────────────
  {
    id: 'wholeTone',
    n: 'Whole Tone', sh: 'WT', co: '#0ea5e9',
    intervals: [0, 2, 4, 6, 8, 10],
    ex: 'Six equal whole steps — dreamlike, floating, no gravity, no leading tone',
    signature: 'Every step is a whole tone — completely symmetric, only 6 notes',
    hint: 'There are only two possible whole-tone scales. Sounds completely ambiguous — no note feels more "home" than any other. Used for dream sequences.',
    songs: [
      { title: 'Claude Debussy — "Voiles" (Sails)', hint: 'Impressionist piano piece built entirely on whole-tone scale' },
      { title: 'Dream sequence music in cartoons / films', hint: 'The "wavy" harp glissando in cartoons is usually a whole-tone scale' },
    ],
  },
  {
    id: 'chromatic',
    n: 'Chromatic', sh: 'Chr', co: '#64748b',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    ex: 'All 12 semitones — tension, drama, passing note heaven',
    signature: 'Every note is a half-step — 12 equal notes, no sense of key',
    hint: 'Unmistakable — every step is the same size. No key, no gravity. Used as a passing-note technique or for dramatic effect.',
    songs: [
      { title: '"Flight of the Bumblebee" — Rimsky-Korsakov', hint: 'Rapid chromatic runs up and down — pure chromatic scale in motion' },
      { title: 'Charlie Parker bebop solos', hint: 'Jazz chromatic approach notes — sliding by half-steps into chord tones' },
    ],
  },
];

export const SCALE_MAP: Record<string, ScaleDef> =
  Object.fromEntries(SCALES.map((s) => [s.id, s]));

// ─── Levels ────────────────────────────────────────────────────────────────

export interface ScaleLevel {
  n: string;
  scales: string[];
}

export const SCALE_LEVELS: ScaleLevel[] = [
  {
    n: 'Foundation',
    scales: ['major', 'naturalMinor', 'pentatonicMajor', 'pentatonicMinor'],
  },
  {
    n: 'Minor flavours',
    scales: ['naturalMinor', 'harmonicMinor', 'dorian', 'phrygian'],
  },
  {
    n: 'Major flavours',
    scales: ['major', 'lydian', 'mixolydian'],
  },
  {
    n: 'All modes',
    scales: ['major', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'naturalMinor', 'locrian'],
  },
  {
    n: 'Exotic',
    scales: ['harmonicMinor', 'wholeTone', 'chromatic'],
  },
];

// ─── Close pairs ──────────────────────────────────────────────────────────

export const SCALE_CLOSE_PAIRS = new Set([
  'major_lydian', 'lydian_major',
  'major_mixolydian', 'mixolydian_major',
  'naturalMinor_dorian', 'dorian_naturalMinor',
  'naturalMinor_phrygian', 'phrygian_naturalMinor',
  'naturalMinor_harmonicMinor', 'harmonicMinor_naturalMinor',
  'phrygian_locrian', 'locrian_phrygian',
  'pentatonicMajor_major', 'major_pentatonicMajor',
  'pentatonicMinor_naturalMinor', 'naturalMinor_pentatonicMinor',
]);

export const SCALE_HINTS: Record<string, string> = {
  'major_lydian':              'Close! Both are major. Lydian has a ♯4 — the 4th note is a half-step higher than expected.',
  'lydian_major':              'Close! Both are major. Major has a natural 4 — the 4th note is where you expect it.',
  'major_mixolydian':         'Close! Both are major. Mixolydian has a ♭7 — the 7th note drops a half-step.',
  'mixolydian_major':         'Close! Both are major. Major has a natural 7 — the 7th note pulls back up to the octave.',
  'naturalMinor_dorian':      'Close! Both are minor. Dorian has a natural 6 — one note brighter. Listen for the 6th step.',
  'dorian_naturalMinor':      'Close! Both are minor. Natural minor has a ♭6 — one note darker. Listen for the 6th step.',
  'naturalMinor_phrygian':    'Close! Both are minor. Phrygian starts with a half-step — the very first move is tighter.',
  'phrygian_naturalMinor':    'Close! Both are minor. Natural minor starts with a whole step — more space in the first move.',
  'naturalMinor_harmonicMinor':'Close! Both are minor. Harmonic minor raises the 7th — you hear a larger leap near the top.',
  'harmonicMinor_naturalMinor':'Close! Both are minor. Natural minor has a ♭7 — the top of the scale is flatter.',
  'phrygian_locrian':          'Close! Both have ♭2. Locrian also has a ♭5 — the 5th step is lower too.',
  'locrian_phrygian':          'Close! Both have ♭2. Phrygian has a natural 5 — the 5th step is a perfect 5th.',
  'pentatonicMajor_major':    'Close! Major pentatonic is a subset of major — only 5 notes, the 4th and 7th are missing.',
  'pentatonicMinor_naturalMinor':'Close! Minor pentatonic is a subset of natural minor — only 5 notes, the 2nd and ♭6 are missing.',
};
