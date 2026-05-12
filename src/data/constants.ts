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

/**
 * A song reference for a chord/interval/mode/progression.
 * - title: how it appears in the feedback sheet (artist + song + the exact moment)
 * - hint: optional one-liner explaining where in the song to listen
 * - phrase: optional melodic hook as semitone offsets from the chord/scale root,
 *           played sequentially. The exercise will transpose this to the
 *           question's root and play it on the user's instrument.
 * - bpm: tempo for the phrase (default 110). Note duration = 60/bpm seconds.
 *
 * Adding a reference: just add a new entry to the `songs: SongRef[]` array
 * on the relevant chord in CHORDS / CHORDS_7TH / CHORDS_9TH. If you want it
 * playable, add a `phrase` array of MIDI offsets from the root. Otherwise
 * it'll show as a text-only mnemonic.
 */
export interface SongRef {
  title: string;
  hint?: string;
  phrase?: number[];
  bpm?: number;
}

export interface Chord {
  id: string;
  n: string;
  sh: string;
  co: string;
  iv: number[];
  fm: string;
  fmd: string;
  ex: string;            // feel description
  songs: SongRef[];      // song mnemonics (extendable — contributors add more)
}

export const CHORDS: Chord[] = [
  {
    id: 'maj', n: 'Major', sh: 'Maj', co: '#22c55e',
    iv: [0, 4, 7], fm: 'R + M3 + P5', fmd: 'M3 + m3',
    ex: 'Bright, happy, resolved',
    songs: [
      {
        title: '"Twinkle Twinkle Little Star"',
        hint: 'Nursery-rhyme major — opening leap outlines R-5-6-5',
        phrase: [0, 0, 7, 7, 9, 9, 7],
        bpm: 130,
      },
      {
        title: '"Let It Be" — Beatles',
        hint: 'Opens on the I major (C), the most "home" sound there is',
        phrase: [4, 4, 4, 4, 5, 7, 5, 4],
        bpm: 100,
      },
      {
        title: '"She Loves You" — Beatles',
        hint: '"Yeah yeah yeah" — bright major triad in the chorus hook',
        phrase: [7, 9, 7, 4],
        bpm: 140,
      },
    ],
  },
  {
    id: 'min', n: 'Minor', sh: 'Min', co: '#3b82f6',
    iv: [0, 3, 7], fm: 'R + m3 + P5', fmd: 'm3 + M3',
    ex: 'Dark, melancholic, inward',
    songs: [
      {
        title: '"Greensleeves" (traditional)',
        hint: 'The opening rise R-m3-4-5 is pure minor melancholy',
        phrase: [0, 3, 5, 7, 8, 7, 5, 3],
        bpm: 110,
      },
      {
        title: '"Eleanor Rigby" — Beatles',
        hint: 'Em throughout — "Ah, look at all the lonely people"',
        phrase: [7, 7, 7, 7, 3, 3, 3, 0],
        bpm: 130,
      },
      {
        title: '"Stairway to Heaven" — Led Zeppelin',
        hint: 'Am opening arpeggio — R-m3-5 descending',
        phrase: [0, 3, 7, 10, 7, 3, 0],
        bpm: 80,
      },
    ],
  },
  {
    id: 'dim', n: 'Diminished', sh: 'Dim', co: '#ef4444',
    iv: [0, 3, 6], fm: 'R + m3 + TT', fmd: 'm3 + m3',
    ex: 'Tense, unstable, danger',
    songs: [
      {
        title: 'Silent-film villain "tied to the train tracks" sting',
        hint: 'The classic dum-dum-DUM! — top note is the tritone',
        phrase: [0, 3, 6, 6],
        bpm: 90,
      },
      {
        title: 'The Simpsons theme (the "Simp-sons" leap)',
        hint: 'That eerie leap from C to F♯ — a tritone, the heart of dim',
        phrase: [0, 6, 5, 3, 0],
        bpm: 130,
      },
      {
        title: '"Be Prepared" — The Lion King (Scar\'s march)',
        hint: 'Dim chord stabs under Scar\'s villain monologue',
        phrase: [0, 3, 6, 3, 0],
        bpm: 100,
      },
    ],
  },
  {
    id: 'aug', n: 'Augmented', sh: 'Aug', co: '#f97316',
    iv: [0, 4, 8], fm: 'R + M3 + m6', fmd: 'M3 + M3',
    ex: 'Mysterious, dreamlike, unsettled',
    songs: [
      {
        title: '"Oh! Darling" — Beatles (opening vocal line)',
        hint: 'The E+ stab right at "Oh! Darling, please believe me"',
        phrase: [0, 4, 8, 4, 0],
        bpm: 80,
      },
      {
        title: 'James Bond theme stinger',
        hint: 'The iconic "dun-dun-DUNNN" — augmented chord wobble',
        phrase: [0, 4, 8, 8],
        bpm: 100,
      },
      {
        title: '"Mr. Blue Sky" — ELO (intro chord)',
        hint: 'That floating, slightly unsettled feel before the sun comes out',
        phrase: [0, 4, 8],
        bpm: 90,
      },
    ],
  },
  {
    id: 'sus2', n: 'Sus 2', sh: 'Sus2', co: '#14b8a6',
    iv: [0, 2, 7], fm: 'R + M2 + P5', fmd: 'M2 + P4',
    ex: 'Open, floating, no third so no major/minor feel',
    songs: [
      {
        title: '"Wonderwall" — Oasis',
        hint: 'The famous opening — sus2 shapes ringing out, no thirds',
        phrase: [0, 2, 7, 2, 0],
        bpm: 90,
      },
      {
        title: '"The Scientist" — Coldplay',
        hint: 'Piano intro — open sus2 voicings, that "floating" colour',
        phrase: [0, 2, 7],
        bpm: 75,
      },
      {
        title: '"Pumped Up Kicks" — Foster the People',
        hint: 'Verse riff — sus2 ambiguity, neither bright nor dark',
        phrase: [0, 2, 7, 2],
        bpm: 130,
      },
    ],
  },
  {
    id: 'sus4', n: 'Sus 4', sh: 'Sus4', co: '#a855f7',
    iv: [0, 5, 7], fm: 'R + P4 + P5', fmd: 'P4 + M2',
    ex: 'Suspended, leans forward, wants to resolve',
    songs: [
      {
        title: '"A Hard Day\'s Night" — Beatles (opening chord)',
        hint: 'The most famous sus4 in pop — that big jangly slap',
        phrase: [0, 5, 7, 0],
        bpm: 130,
      },
      {
        title: '"Pinball Wizard" — The Who',
        hint: 'Bsus4 → B intro — feel the lean-and-resolve',
        phrase: [0, 5, 7, 5, 4],
        bpm: 130,
      },
      {
        title: 'Big Ben chime (Westminster Quarters)',
        hint: 'The first chime hits the 4 over the root — pure sus4 feel',
        phrase: [7, 5, 2, 0],
        bpm: 60,
      },
    ],
  },
  {
    id: 'maj7', n: 'Major 7th', sh: 'Maj7', co: '#06b6d4',
    iv: [0, 4, 7, 11], fm: 'R + M3 + P5 + M7', fmd: 'M3 + m3 + M3',
    ex: 'Dreamy, sophisticated, bittersweet',
    songs: [
      {
        title: '"Something" — Beatles',
        hint: 'Cmaj7 on the opening — that bittersweet glow',
        phrase: [11, 7, 4, 0],
        bpm: 70,
      },
      {
        title: '"Here Comes the Sun" — Beatles (intro arpeggio)',
        hint: 'Dmaj7 chord shimmer — the sun rising in chord form',
        phrase: [0, 4, 7, 11, 7, 4],
        bpm: 130,
      },
      {
        title: '"Girl from Ipanema" — bossa nova standard',
        hint: 'Fmaj7 throughout the verse — definitive dreamy major 7',
        phrase: [0, 4, 7, 11],
        bpm: 110,
      },
    ],
  },
  {
    id: 'min7', n: 'Minor 7th', sh: 'Min7', co: '#8b5cf6',
    iv: [0, 3, 7, 10], fm: 'R + m3 + P5 + m7', fmd: 'm3 + M3 + m3',
    ex: 'Smooth, soulful, relaxed minor',
    songs: [
      {
        title: '"Come Together" — Beatles',
        hint: 'The riff outlines Am7 — silky minor with that ♭7 on top',
        phrase: [0, 7, 10, 7, 3, 0],
        bpm: 85,
      },
      {
        title: '"Superstition" — Stevie Wonder',
        hint: 'Em7 clavinet riff — funk minor 7 at its purest',
        phrase: [0, 3, 7, 10, 7, 3],
        bpm: 100,
      },
      {
        title: '"Breezin\'" — George Benson',
        hint: 'Jazz/soul guitar — min7 chord movement throughout',
        phrase: [0, 10, 7, 3, 0],
        bpm: 100,
      },
    ],
  },
  {
    id: 'dom7', n: 'Dominant 7th', sh: 'Dom7', co: '#f43f5e',
    iv: [0, 4, 7, 10], fm: 'R + M3 + P5 + m7', fmd: 'M3 + m3 + m3',
    ex: 'Bluesy, wants to resolve, tension + drive',
    songs: [
      {
        title: '"Twist and Shout" — Beatles',
        hint: 'The whole song lives on D7 → G7 → A7 — pure dominant 7 energy',
        phrase: [0, 4, 7, 10, 7, 4],
        bpm: 130,
      },
      {
        title: '"Hound Dog" — Elvis Presley',
        hint: 'Classic 12-bar blues — every chord (I, IV, V) is a dom7',
        phrase: [0, 4, 7, 10, 10, 7, 4, 0],
        bpm: 170,
      },
      {
        title: '"Birthday" — Beatles (the bluesy stomp)',
        hint: 'A7 riff hammering — bluesy major + ♭7 tension',
        phrase: [0, 7, 10, 7, 4, 0],
        bpm: 140,
      },
    ],
  },
  {
    id: 'm7b5', n: 'Half-Diminished', sh: 'm7♭5', co: '#a855f7',
    iv: [0, 3, 6, 10], fm: 'R + m3 + ♭5 + m7', fmd: 'm3 + m3 + M3',
    ex: 'Bittersweet, melancholy with tension — the iiø of minor keys',
    songs: [
      {
        title: '"Cry Me a River" — Julie London',
        hint: 'The iiø7 in the ii–V–i — heart of the song\'s sadness',
        phrase: [0, 3, 6, 10, 6, 3, 0],
        bpm: 80,
      },
      {
        title: '"Yesterday" — Beatles (the "Suddenly" moment)',
        hint: 'F♯ø7 lands under "Sud-den-ly" — that aching turn',
        phrase: [0, 3, 6, 10],
        bpm: 90,
      },
      {
        title: '"Black Orpheus" (bossa standard)',
        hint: 'iiø7 → V7 → i — definitive half-dim sound in minor jazz',
        phrase: [10, 6, 3, 0],
        bpm: 100,
      },
    ],
  },
  {
    id: 'dim7', n: 'Diminished 7th', sh: 'dim7', co: '#dc2626',
    iv: [0, 3, 6, 9], fm: 'R + m3 + ♭5 + ♭♭7', fmd: 'm3 + m3 + m3',
    ex: 'Maximum tension — symmetrical, every stack of m3, classic horror chord',
    songs: [
      {
        title: 'Silent-film "tied to the train tracks" sting',
        hint: 'Symmetric chord of pure dread — every note a m3 apart',
        phrase: [0, 3, 6, 9, 9, 6, 3, 0],
        bpm: 90,
      },
      {
        title: '"Michelle" — Beatles',
        hint: 'The chromatic descent passes through dim7 on the turnaround',
        phrase: [0, 3, 6, 9, 8],
        bpm: 100,
      },
      {
        title: 'Looney Tunes "uh-oh" stinger',
        hint: 'Cartoon shock chord — pure dim7',
        phrase: [0, 3, 6, 9],
        bpm: 130,
      },
    ],
  },
  {
    id: 'mMaj7', n: 'Minor-Major 7th', sh: 'mMaj7', co: '#0ea5e9',
    iv: [0, 3, 7, 11], fm: 'R + m3 + P5 + M7', fmd: 'm3 + M3 + M3',
    ex: 'Cinematic, James Bond — minor body with a bright leading-tone halo',
    songs: [
      {
        title: 'James Bond theme — the iconic stinger',
        hint: 'EmMaj7 — minor body, M7 on top, pure spy noir',
        phrase: [0, 3, 7, 11, 11, 7, 3, 0],
        bpm: 100,
      },
      {
        title: '"Something" — Beatles (bridge — "You\'re asking me...")',
        hint: 'CmMaj7 colour as the bridge melody climbs',
        phrase: [11, 7, 3, 0],
        bpm: 75,
      },
      {
        title: '"Stairway to Heaven" — Led Zeppelin (intro)',
        hint: 'The chromatic descending bass under Am implies mMaj7',
        phrase: [0, 3, 7, 11, 10, 8, 7],
        bpm: 70,
      },
    ],
  },
  {
    id: 'dom7b9', n: 'Dom 7♭9', sh: '7♭9', co: '#ef4444',
    iv: [0, 4, 7, 10, 13], fm: 'R + M3 + P5 + m7 + ♭9', fmd: 'dom7 + ♭9',
    ex: 'Urgent, jaws-of-tension — V7 of minor, wants to resolve hard',
    songs: [
      {
        title: '"Jaws" theme — John Williams',
        hint: '♭9 is the most dissonant tension — the shark approaches',
        phrase: [0, 13, 0, 13, 0, 13, 13],
        bpm: 130,
      },
      {
        title: '"Michelle" — Beatles ("I love you" turnaround)',
        hint: 'V7♭9 of the iim — the classic French-chanson tension',
        phrase: [0, 4, 7, 10, 13],
        bpm: 100,
      },
      {
        title: '"Black Orpheus" — V7♭9 going to i in minor',
        hint: 'Bossa standard — leans on the ♭9 for that yearning resolve',
        phrase: [13, 10, 7, 4, 0],
        bpm: 110,
      },
    ],
  },
  {
    id: 'dom7sharp9', n: 'Dom 7♯9 (Hendrix)', sh: '7♯9', co: '#f97316',
    iv: [0, 4, 7, 10, 15], fm: 'R + M3 + P5 + m7 + ♯9', fmd: 'dom7 + ♯9',
    ex: 'Spicy, bluesy bite — the "Hendrix chord", major + minor 3rd stacked',
    songs: [
      {
        title: '"Purple Haze" — Jimi Hendrix',
        hint: 'The whole song hinges on E7♯9 — major/minor ambiguity in one chord',
        phrase: [0, 4, 7, 10, 15, 10, 7, 4],
        bpm: 110,
      },
      {
        title: '"Taxman" — Beatles',
        hint: 'D7♯9 cuts through the verse — Hendrix-chord stab',
        phrase: [0, 4, 7, 10, 15],
        bpm: 130,
      },
      {
        title: '"Foxy Lady" — Jimi Hendrix',
        hint: 'F♯7♯9 ostinato — Hendrix\'s signature wah-wah colour',
        phrase: [15, 10, 7, 4, 0],
        bpm: 120,
      },
    ],
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
  { n: 'Easy',     ch: ['maj', 'min', 'dim', 'sus4'] },
  { n: 'Medium',   ch: ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', 'dom7'] },
  { n: 'Hard',     ch: ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', 'maj7', 'min7', 'dom7'] },
  { n: 'Expert',   ch: ['maj7', 'min7', 'dom7', 'm7b5', 'dim7', 'mMaj7', 'dom7b9', 'dom7sharp9'] },
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
