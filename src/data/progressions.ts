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

// ─── Song progression ────────────────────────────────────────────────────────
// A fixed sequence of chord ids, plus display metadata.

export interface SongProgression {
  title: string;
  artist: string;
  /** Brief note on what makes it interesting harmonically */
  note: string;
  /** Chord ids in order — must all exist in PROGRESSION_CHORD_MAP */
  chords: string[];
  /** true if it contains non-diatonic chords */
  hasNonDiatonic?: boolean;
  /** bpm hint — for display only */
  tempo?: number;
}

// All transposed to a common "I = 0" roman-numeral language.
// The exercise engine transposes to the user's key at runtime.
// Sources cross-checked against theory transcriptions — keyboard-heavy / melodically
// memorable progressions prioritised.

export const SONG_PROGRESSIONS: SongProgression[] = [
  // ── Pop / Rock classics ────────────────────────────────────────────────
  {
    title: 'Let It Be',
    artist: 'The Beatles',
    note: 'I–V–vi–IV, the most famous 4-chord loop',
    chords: ['I', 'V', 'vi', 'IV'],
    tempo: 74,
  },
  {
    title: 'Hey Jude',
    artist: 'The Beatles',
    note: 'I–V–IV–I — piano anthem, stark and open',
    chords: ['I', 'V', 'IV', 'I'],
    tempo: 74,
  },
  {
    title: 'Don\'t Stop Believin\'',
    artist: 'Journey',
    note: 'I–V–vi–iii–IV–I–IV–V — Jonathan Cain\'s iconic piano intro',
    chords: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    tempo: 119,
  },
  {
    title: 'Piano Man',
    artist: 'Billy Joel',
    note: 'I–V–vi–IV–ii–V — Billy Joel\'s signature waltz feel (3/4)',
    chords: ['I', 'V', 'vi', 'IV', 'ii', 'V'],
    tempo: 92,
  },
  {
    title: 'Bennie and the Jets',
    artist: 'Elton John',
    note: 'Imaj7–IV–iii–vi — lush major-7 chords throughout',
    chords: ['Imaj7', 'IV', 'iii', 'vi'],
    tempo: 126,
  },
  {
    title: 'Tiny Dancer',
    artist: 'Elton John',
    note: 'I–IV–I–V–IV–I — slow build, Elton\'s open piano block chords',
    chords: ['I', 'IV', 'I', 'V', 'IV', 'I'],
    tempo: 70,
  },
  {
    title: 'Your Song',
    artist: 'Elton John',
    note: 'I–IV–V–IV–ii — Elton\'s debut hit, textbook major with a ii surprise',
    chords: ['I', 'IV', 'V', 'IV', 'ii'],
    tempo: 80,
  },
  {
    title: 'Someone Like You',
    artist: 'Adele',
    note: 'I–V–vi–IV — Adele\'s stripped piano ballad, classic 4-chord',
    chords: ['I', 'V', 'vi', 'IV'],
    tempo: 67,
  },
  {
    title: 'Clocks',
    artist: 'Coldplay',
    note: 'I–V–ii — Coldplay\'s three-chord minimalist piano loop',
    chords: ['I', 'V', 'ii'],
    tempo: 130,
  },
  {
    title: 'The Scientist',
    artist: 'Coldplay',
    note: 'ii–IV–I–V — melancholy minor-ii start, Chris Martin\'s piano ballad',
    chords: ['ii', 'IV', 'I', 'V'],
    tempo: 75,
  },
  {
    title: 'Yellow',
    artist: 'Coldplay',
    note: 'I–Imaj7–IV–vi — note the Imaj7 passing colour',
    chords: ['I', 'Imaj7', 'IV', 'vi'],
    tempo: 88,
  },
  {
    title: 'Gravity',
    artist: 'John Mayer',
    note: 'I–IV–I–V–ii–IV — slow blues-inflected pop, sparse piano',
    chords: ['I', 'IV', 'I', 'V', 'ii', 'IV'],
    tempo: 66,
  },
  {
    title: 'Rocket Man',
    artist: 'Elton John',
    note: 'Imaj7–IVmaj7–I–IV — dreamy major-7 colours, Davey Johnstone + Elton',
    chords: ['Imaj7', 'IVmaj7', 'I', 'IV'],
    tempo: 126,
  },
  {
    title: 'Crocodile Rock',
    artist: 'Elton John',
    note: 'I–vi–IV–V — classic 50s-era doo-wop loop, banging piano',
    chords: ['I', 'vi', 'IV', 'V'],
    tempo: 167,
  },
  {
    title: 'Budapest',
    artist: 'George Ezra',
    note: 'I–ii–IV–I — deceptively simple piano ballad',
    chords: ['I', 'ii', 'IV', 'I'],
    tempo: 128,
  },

  // ── Jazz / Soul / R&B ──────────────────────────────────────────────────
  {
    title: 'Autumn Leaves',
    artist: 'Jazz Standard',
    note: 'ii7–V7–Imaj7–IVmaj7 — the definitive ii-V-I taught in every jazz class',
    chords: ['ii7', 'V7', 'Imaj7', 'IVmaj7'],
    tempo: 80,
  },
  {
    title: 'Fly Me to the Moon',
    artist: 'Frank Sinatra / J. Howard',
    note: 'ii7–V7–Imaj7–vi7 — standard jazz cycle-of-fifths motion',
    chords: ['ii7', 'V7', 'Imaj7', 'vi7'],
    tempo: 140,
  },
  {
    title: 'A Whiter Shade of Pale',
    artist: 'Procol Harum',
    note: 'I–V–vi–IV–ii–V — Bach-inflected descending bass, organ classic',
    chords: ['I', 'V', 'vi', 'IV', 'ii', 'V'],
    tempo: 60,
  },
  {
    title: 'Georgia on My Mind',
    artist: 'Ray Charles',
    note: 'Imaj7–V/vi–vi7–ii7–V7 — Ray Charles piano, rich tonal motion',
    chords: ['Imaj7', 'V/vi', 'vi7', 'ii7', 'V7'],
    hasNonDiatonic: true,
    tempo: 60,
  },

  // ── Non-diatonic song examples ─────────────────────────────────────────
  {
    title: 'Let Her Go',
    artist: 'Passenger',
    note: 'I–V–vi–IV–bVII — the ♭VII borrowed chord adds a folk-rock edge',
    chords: ['I', 'V', 'vi', 'IV', 'bVII'],
    hasNonDiatonic: true,
    tempo: 100,
  },
  {
    title: 'Africa',
    artist: 'Toto',
    note: 'I–V–bVII–IV — ♭VII gives it that majestic open feel',
    chords: ['I', 'V', 'bVII', 'IV'],
    hasNonDiatonic: true,
    tempo: 93,
  },
  {
    title: 'With or Without You',
    artist: 'U2',
    note: 'I–V–vi–IV — simple 4-chord, but the iv minor version in outro borrows',
    chords: ['I', 'V', 'vi', 'IV'],
    tempo: 110,
  },
  {
    title: 'I Will Follow You into the Dark',
    artist: 'Death Cab for Cutie',
    note: 'I–IV–iv–I — the iv minor subdominant is the emotional gut-punch',
    chords: ['I', 'IV', 'iv', 'I'],
    hasNonDiatonic: true,
    tempo: 96,
  },
  {
    title: 'Baby',
    artist: 'Justin Bieber',
    note: 'I–V–vi–IV — quintessential 4-chord pop loop',
    chords: ['I', 'V', 'vi', 'IV'],
    tempo: 130,
  },
  {
    title: 'Take on Me',
    artist: 'a-ha',
    note: 'I–V/V–V–IV — the V/V secondary dominant is the hook\'s color',
    chords: ['I', 'V/V', 'V', 'IV'],
    hasNonDiatonic: true,
    tempo: 169,
  },
  {
    title: 'Creep',
    artist: 'Radiohead',
    note: 'I–bIII–IV–iv — bIII and iv = borrowed, bIII is the jarring "wrong" chord before IV',
    chords: ['I', 'bIII', 'IV', 'iv'],
    hasNonDiatonic: true,
    tempo: 92,
  },
  {
    title: 'Just the Way You Are',
    artist: 'Bruno Mars',
    note: 'I–bVII–IV–I — ♭VII is the Mixolydian soul flavour',
    chords: ['I', 'bVII', 'IV', 'I'],
    hasNonDiatonic: true,
    tempo: 109,
  },
  {
    title: 'Mr. Brightside',
    artist: 'The Killers',
    note: 'I–V–vi–IV — piano arpeggios on the 4-chord loop at blistering pace',
    chords: ['I', 'V', 'vi', 'IV'],
    tempo: 148,
  },
  {
    title: 'All of Me',
    artist: 'John Legend',
    note: 'vi–IV–I–V — starting on vi gives it the minor-tonic emotional weight',
    chords: ['vi', 'IV', 'I', 'V'],
    tempo: 63,
  },
  {
    title: 'Stay With Me',
    artist: 'Sam Smith',
    note: 'vi–IV–I — three-chord minor-start gospel feel',
    chords: ['vi', 'IV', 'I'],
    tempo: 82,
  },
  {
    title: 'Shallow',
    artist: 'Lady Gaga / Bradley Cooper',
    note: 'vi–IV–I–V — chorus explodes off the same 4-chord pool from vi',
    chords: ['vi', 'IV', 'I', 'V'],
    tempo: 96,
  },
  {
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    note: 'I–V–vi–IV — 80s synth-pop 4-chord with driving energy',
    chords: ['I', 'V', 'vi', 'IV'],
    tempo: 171,
  },
  {
    title: 'I\'m Yours',
    artist: 'Jason Mraz',
    note: 'I–V–vi–IV — island reggae-pop 4-chord',
    chords: ['I', 'V', 'vi', 'IV'],
    tempo: 102,
  },
  {
    title: 'Perfect',
    artist: 'Ed Sheeran',
    note: 'I–vi–IV–V — classical ballad sequence',
    chords: ['I', 'vi', 'IV', 'V'],
    tempo: 95,
  },
  {
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    note: 'vi–IV–I–V — loop from vi gives it the minor groove',
    chords: ['vi', 'IV', 'I', 'V'],
    tempo: 96,
  },
  {
    title: 'Bohemian Rhapsody (ballad)',
    artist: 'Queen',
    note: 'I–V/V–V–bVI — V/V and ♭VI give it the opera-film drama',
    chords: ['I', 'V/V', 'V', 'bVI'],
    hasNonDiatonic: true,
    tempo: 72,
  },
  {
    title: 'Can\'t Help Falling in Love',
    artist: 'Elvis Presley',
    note: 'I–iii–IV–V — iii makes this feel regal and old-world',
    chords: ['I', 'iii', 'IV', 'V'],
    tempo: 56,
  },
  {
    title: 'Despacito',
    artist: 'Luis Fonsi',
    note: 'vi–iii–IV–I — minor-tonic loop, Latin flavor',
    chords: ['vi', 'iii', 'IV', 'I'],
    tempo: 89,
  },
];

// ─── Levels ────────────────────────────────────────────────────────────────

export interface ProgressionLevel {
  n: string;
  /** short description shown in the UI */
  desc?: string;
  /** For random levels: allowed chord ids */
  ch?: string[];
  /** Min/max progression length (inclusive). 'random' = exercise default */
  minLen: number;
  maxLen: number;
  /** If true, questions are drawn from SONG_PROGRESSIONS instead of randomly generated */
  isSong?: boolean;
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
    n: 'Triads + 7ths',
    desc: 'Full diatonic palette',
    ch: ['I', 'Imaj7', 'ii', 'ii7', 'iii', 'iii7', 'IV', 'IVmaj7', 'V', 'V7', 'vi', 'vi7', 'vii°', 'viiø7'],
    minLen: 3, maxLen: 5,
  },
  {
    n: 'Song Progressions',
    desc: 'Real songs',
    isSong: true,
    minLen: 3, maxLen: 8,
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
