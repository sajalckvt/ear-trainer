export interface MelodyNote {
  midi: number;
  beats: number; // quarter-note beats
}

export interface Melody {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  notes: MelodyNote[];
}

// All notes within A3–G5 (MIDI 57–79). Verified range: C4=60, G5=79.
export const MELODIES: Melody[] = [
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    artist: 'Traditional',
    bpm: 100,
    notes: [
      { midi: 60, beats: 1 }, // C4 - Twin-
      { midi: 60, beats: 1 }, // C4 - -kle
      { midi: 67, beats: 1 }, // G4 - Twin-
      { midi: 67, beats: 1 }, // G4 - -kle
      { midi: 69, beats: 1 }, // A4 - lit-
      { midi: 69, beats: 1 }, // A4 - -tle
      { midi: 67, beats: 2 }, // G4 - star
      { midi: 65, beats: 1 }, // F4 - How
      { midi: 65, beats: 1 }, // F4 - I
      { midi: 64, beats: 1 }, // E4 - won-
      { midi: 64, beats: 1 }, // E4 - -der
      { midi: 62, beats: 1 }, // D4 - what
      { midi: 62, beats: 1 }, // D4 - you
      { midi: 60, beats: 2 }, // C4 - are
    ],
  },
  {
    id: 'ode_to_joy',
    title: 'Ode to Joy',
    artist: 'Beethoven',
    bpm: 100,
    notes: [
      { midi: 64, beats: 1 },   // E4
      { midi: 64, beats: 1 },   // E4
      { midi: 65, beats: 1 },   // F4
      { midi: 67, beats: 1 },   // G4
      { midi: 67, beats: 1 },   // G4
      { midi: 65, beats: 1 },   // F4
      { midi: 64, beats: 1 },   // E4
      { midi: 62, beats: 1 },   // D4
      { midi: 60, beats: 1 },   // C4
      { midi: 60, beats: 1 },   // C4
      { midi: 62, beats: 1 },   // D4
      { midi: 64, beats: 1 },   // E4
      { midi: 64, beats: 1.5 }, // E4 (dotted)
      { midi: 62, beats: 0.5 }, // D4
      { midi: 62, beats: 2 },   // D4
    ],
  },
  {
    id: 'mary',
    title: 'Mary Had a Little Lamb',
    artist: 'Traditional',
    bpm: 110,
    notes: [
      { midi: 64, beats: 1 }, // E4 - Ma-
      { midi: 62, beats: 1 }, // D4 - -ry
      { midi: 60, beats: 1 }, // C4 - had
      { midi: 62, beats: 1 }, // D4 - a
      { midi: 64, beats: 1 }, // E4 - lit-
      { midi: 64, beats: 1 }, // E4 - -tle
      { midi: 64, beats: 2 }, // E4 - lamb
      { midi: 62, beats: 1 }, // D4 - lit-
      { midi: 62, beats: 1 }, // D4 - -tle
      { midi: 62, beats: 2 }, // D4 - lamb
      { midi: 64, beats: 1 }, // E4 - lit-
      { midi: 67, beats: 1 }, // G4 - -tle
      { midi: 67, beats: 2 }, // G4 - lamb
    ],
  },
];
