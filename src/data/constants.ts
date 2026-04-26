export const NN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export const ND = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export const SAMPLE_LO = 57;
export const SAMPLE_HI = 79;

export interface Interval {
  st: number;
  n: string;
  sh: string;
  co: string;
  rf: string;
  al?: string;
}

export const IVS: Interval[] = [
  { st: 0,  n: 'Unison',     sh: 'P1', co: '#818cf8', rf: 'Same note twice' },
  { st: 1,  n: 'Minor 2nd',  sh: 'm2', co: '#ef4444', rf: 'Jaws theme' },
  { st: 2,  n: 'Major 2nd',  sh: 'M2', co: '#f97316', rf: 'Happy Birthday' },
  { st: 3,  n: 'Minor 3rd',  sh: 'm3', co: '#eab308', rf: 'Crazy Frog / Hey Joe intro' },
  { st: 4,  n: 'Major 3rd',  sh: 'M3', co: '#22c55e', rf: "Can't Buy Me Love — Beatles", al: 'Kumbaya / Ob-La-Di' },
  { st: 5,  n: 'Perfect 4th',sh: 'P4', co: '#14b8a6', rf: 'Here Comes the Bride', al: 'We Will Rock You (stomp-stomp-clap gap)' },
  { st: 6,  n: 'Tritone',    sh: 'TT', co: '#a855f7', rf: 'The Simpsons theme', al: 'Maria — West Side Story' },
  { st: 7,  n: 'Perfect 5th',sh: 'P5', co: '#3b82f6', rf: 'Twinkle Twinkle', al: 'Star Wars main theme' },
  { st: 8,  n: 'Minor 6th',  sh: 'm6', co: '#ec4899', rf: 'The Entertainer', al: 'Think — Aretha Franklin' },
  { st: 9,  n: 'Major 6th',  sh: 'M6', co: '#f43f5e', rf: 'My Bonnie Lies Over the Ocean', al: 'Jingle Bells' },
  { st: 10, n: 'Minor 7th',  sh: 'm7', co: '#8b5cf6', rf: "Somewhere — West Side Story", al: "Can't Stop — RHCP (verse)" },
  { st: 11, n: 'Major 7th',  sh: 'M7', co: '#06b6d4', rf: 'Take On Me — a-ha', al: 'Don\'t Know Why — Norah Jones' },
  { st: 12, n: 'Octave',     sh: 'P8', co: '#6d28d9', rf: 'Somewhere Over the Rainbow', al: 'Bali Hai — South Pacific' },
  { st: 13, n: 'Minor 9th',  sh: 'm9', co: '#ef4444', rf: 'Jaws + an octave' },
  { st: 14, n: 'Major 9th',  sh: 'M9', co: '#f97316', rf: 'Happy Birthday + an octave' },
];

export interface Chord {
  id: string;
  n: string;
  sh: string;
  co: string;
  iv: number[];
  fm: string;
  fmd: string;
  ex: string;       // feel description
  song: string;     // primary song mnemonic
  songAlt?: string; // alt song mnemonic
}

export const CHORDS: Chord[] = [
  {
    id: 'maj', n: 'Major', sh: 'Maj', co: '#22c55e',
    iv: [0, 4, 7], fm: 'R + M3 + P5', fmd: 'M3 + m3',
    ex: 'Bright, happy, resolved',
    song: '"She Loves You" — Beatles (yeah yeah yeah opening chord)',
    songAlt: '"Let Her Go" — Passenger',
  },
  {
    id: 'min', n: 'Minor', sh: 'Min', co: '#3b82f6',
    iv: [0, 3, 7], fm: 'R + m3 + P5', fmd: 'm3 + M3',
    ex: 'Dark, melancholic, inward',
    song: '"Eleanor Rigby" — Beatles (Em throughout, famously dark)',
    songAlt: '"While My Guitar Gently Weeps" — Beatles',
  },
  {
    id: 'dim', n: 'Diminished', sh: 'Dim', co: '#ef4444',
    iv: [0, 3, 6], fm: 'R + m3 + TT', fmd: 'm3 + m3',
    ex: 'Tense, unstable, danger',
    song: 'Silent-film villain music — the "tied to the train tracks" moment',
    songAlt: '"Be Prepared" — The Lion King (Scar\'s march)',
  },
  {
    id: 'aug', n: 'Augmented', sh: 'Aug', co: '#f97316',
    iv: [0, 4, 8], fm: 'R + M3 + m6', fmd: 'M3 + M3',
    ex: 'Mysterious, dreamlike, unsettled',
    song: '"Oh! Darling" — Beatles (opening vocal line)',
    songAlt: 'James Bond theme stinger / "Goodbye Yellow Brick Road" — Elton John',
  },
  {
    id: 'sus2', n: 'Sus 2', sh: 'Sus2', co: '#14b8a6',
    iv: [0, 2, 7], fm: 'R + M2 + P5', fmd: 'M2 + P4',
    ex: 'Open, floating, no third so no major/minor feel',
    song: '"Wonderwall" — Oasis (built almost entirely on sus2/sus4)',
    songAlt: '"The Scientist" — Coldplay',
  },
  {
    id: 'sus4', n: 'Sus 4', sh: 'Sus4', co: '#a855f7',
    iv: [0, 5, 7], fm: 'R + P4 + P5', fmd: 'P4 + M2',
    ex: 'Suspended, leans forward, wants to resolve',
    song: '"A Hard Day\'s Night" — Beatles (the famous opening chord has a Sus4)',
    songAlt: '"Creep" — Radiohead (the sus4 → major resolution)',
  },
  {
    id: 'maj7', n: 'Major 7th', sh: 'Maj7', co: '#06b6d4',
    iv: [0, 4, 7, 11], fm: 'R + M3 + P5 + M7', fmd: 'M3 + m3 + M3',
    ex: 'Dreamy, sophisticated, bittersweet',
    song: '"Something" — Beatles (Cmaj7 in the chorus)',
    songAlt: '"Here Comes the Sun" — Beatles',
  },
  {
    id: 'min7', n: 'Minor 7th', sh: 'Min7', co: '#8b5cf6',
    iv: [0, 3, 7, 10], fm: 'R + m3 + P5 + m7', fmd: 'm3 + M3 + m3',
    ex: 'Smooth, soulful, relaxed minor',
    song: '"Come Together" — Beatles (the riff outlines Am7 perfectly)',
    songAlt: '"Superstition" — Stevie Wonder',
  },
  {
    id: 'dom7', n: 'Dominant 7th', sh: 'Dom7', co: '#f43f5e',
    iv: [0, 4, 7, 10], fm: 'R + M3 + P5 + m7', fmd: 'M3 + m3 + m3',
    ex: 'Bluesy, wants to resolve, tension + drive',
    song: '"Twist and Shout" — Beatles ("Shake it up baby" — the whole song lives on Dom7)',
    songAlt: 'Any 12-bar blues (the I, IV, and V are all Dom7)',
  },
];

export interface IntervalLevel {
  n: string;
  iv: number[];
  cross: boolean;
}

export const IV_LEVELS: IntervalLevel[] = [
  { n: 'Beginner', iv: [0, 4, 7, 12], cross: false },
  { n: 'Easy',     iv: [0, 3, 4, 5, 7, 12], cross: false },
  { n: 'Medium',   iv: [0, 2, 3, 4, 5, 6, 7, 9, 12], cross: false },
  { n: 'Hard',     iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], cross: false },
  { n: 'Expert',   iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], cross: true },
];

export interface ChordLevel {
  n: string;
  ch: string[];
}

export const CH_LEVELS: ChordLevel[] = [
  { n: 'Beginner', ch: ['maj', 'min'] },
  { n: 'Easy',     ch: ['maj', 'min', 'sus4', 'dim'] },
  { n: 'Medium',   ch: ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'] },
  { n: 'Hard',     ch: ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', 'dom7'] },
  { n: 'Expert',   ch: ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', 'maj7', 'min7', 'dom7'] },
];

export interface Instrument {
  id: string;
  lb: string;
  ic: string;
}

export const INSTS: Instrument[] = [
  { id: 'choir_aahs',           lb: 'Choir',  ic: '🎤' },
  { id: 'voice_oohs',           lb: 'Voice',  ic: '🗣' },
  { id: 'acoustic_grand_piano', lb: 'Piano',  ic: '🎹' },
  { id: 'violin',               lb: 'Violin', ic: '🎻' },
];

export interface GuitarString {
  n: string;
  m: number;
  g: number;
}

export const GS: GuitarString[] = [
  { n: 'e', m: 64, g: 1 },
  { n: 'B', m: 59, g: 1.4 },
  { n: 'G', m: 55, g: 1.9 },
  { n: 'D', m: 50, g: 2.2 },
  { n: 'A', m: 45, g: 2.6 },
  { n: 'E', m: 40, g: 3 },
];
