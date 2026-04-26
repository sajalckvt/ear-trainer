export interface MelodyNote {
  midi: number;
  beats: number; // quarter-note beats
}

export interface Melody {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  difficulty: 'easy' | 'medium' | 'hard';
  notes: MelodyNote[];
}

function n(midi: number, beats = 1): MelodyNote { return { midi, beats }; }

export const MELODIES: Melody[] = [
  // ── Traditional / Classical ────────────────────────────────────────────
  {
    id: 'twinkle', title: 'Twinkle Twinkle Little Star', artist: 'Traditional',
    bpm: 100, difficulty: 'easy',
    notes: [n(60),n(60),n(67),n(67),n(69),n(69),n(67,2),n(65),n(65),n(64),n(64),n(62),n(62),n(60,2)],
  },
  {
    id: 'ode_to_joy', title: 'Ode to Joy', artist: 'Beethoven',
    bpm: 100, difficulty: 'easy',
    notes: [n(64),n(64),n(65),n(67),n(67),n(65),n(64),n(62),n(60),n(60),n(62),n(64),n(64,1.5),n(62,0.5),n(62,2)],
  },
  {
    id: 'mary', title: 'Mary Had a Little Lamb', artist: 'Traditional',
    bpm: 110, difficulty: 'easy',
    notes: [n(64),n(62),n(60),n(62),n(64),n(64),n(64,2),n(62),n(62),n(62,2),n(64),n(67),n(67,2)],
  },

  // ── The Beatles ────────────────────────────────────────────────────────
  {
    id: 'here_comes_sun', title: 'Here Comes the Sun', artist: 'The Beatles',
    bpm: 120, difficulty: 'easy',
    notes: [n(74),n(73),n(74),n(76),n(74),n(71),n(69),n(67),n(69),n(67),n(64),n(62,2)],
  },
  {
    id: 'let_it_be', title: 'Let It Be', artist: 'The Beatles',
    bpm: 75, difficulty: 'medium',
    notes: [n(67),n(67),n(64),n(67),n(69),n(69),n(67),n(65),n(65),n(65),n(64),n(62),n(60,2)],
  },
  {
    id: 'hey_jude', title: 'Hey Jude', artist: 'The Beatles',
    bpm: 65, difficulty: 'medium',
    notes: [n(72),n(70),n(65),n(65),n(67),n(65),n(63),n(65),n(70),n(70),n(70),n(65,2)],
  },
  {
    id: 'blackbird', title: 'Blackbird', artist: 'The Beatles',
    bpm: 92, difficulty: 'medium',
    notes: [n(67),n(69),n(70),n(71),n(72),n(71),n(69),n(67),n(64),n(67),n(69),n(70),n(71,2)],
  },
  {
    id: 'norwegian_wood', title: 'Norwegian Wood', artist: 'The Beatles',
    bpm: 138, difficulty: 'hard',
    notes: [n(64),n(62),n(64),n(62),n(64),n(59),n(62),n(57),n(59),n(62),n(64),n(62,2)],
  },
  {
    id: 'come_together', title: 'Come Together', artist: 'The Beatles',
    bpm: 82, difficulty: 'hard',
    notes: [n(57),n(57),n(60),n(62),n(64),n(62),n(60),n(57),n(57),n(62),n(64),n(67),n(69,2)],
  },
  {
    id: 'in_my_life', title: 'In My Life', artist: 'The Beatles',
    bpm: 104, difficulty: 'hard',
    notes: [n(69),n(68),n(69),n(71),n(74),n(73),n(71),n(69),n(68),n(66),n(68),n(69,2)],
  },

  // ── Grateful Dead ─────────────────────────────────────────────────────
  {
    id: 'ripple', title: 'Ripple', artist: 'Grateful Dead',
    bpm: 92, difficulty: 'easy',
    notes: [n(67),n(67),n(69),n(67),n(64),n(62),n(64),n(67),n(67),n(65),n(64),n(62,2)],
  },
  {
    id: 'friend_devil', title: 'Friend of the Devil', artist: 'Grateful Dead',
    bpm: 138, difficulty: 'medium',
    notes: [n(67),n(69),n(67),n(64),n(62),n(64),n(62),n(59),n(62),n(60),n(62),n(64,2)],
  },

  // ── Led Zeppelin ──────────────────────────────────────────────────────
  {
    id: 'stairway', title: 'Stairway to Heaven', artist: 'Led Zeppelin',
    bpm: 72, difficulty: 'hard',
    notes: [n(57,0.5),n(60,0.5),n(64,0.5),n(69,0.5),n(71,0.5),n(72,0.5),n(64,0.5),n(71,0.5),
            n(57,0.5),n(60,0.5),n(64,0.5),n(68,0.5),n(71,0.5),n(69,1.5)],
  },
  {
    id: 'going_california', title: 'Going to California', artist: 'Led Zeppelin',
    bpm: 126, difficulty: 'medium',
    notes: [n(62),n(64),n(66),n(69),n(71),n(69),n(66),n(64),n(62),n(64),n(66),n(69,2)],
  },

  // ── Rush ──────────────────────────────────────────────────────────────
  {
    id: 'closer_heart', title: 'Closer to the Heart', artist: 'Rush',
    bpm: 130, difficulty: 'medium',
    notes: [n(71),n(71),n(69),n(68),n(69),n(64),n(64),n(62),n(64),n(66),n(69),n(71,2)],
  },

  // ── Pink Floyd ────────────────────────────────────────────────────────
  {
    id: 'wish_here', title: 'Wish You Were Here', artist: 'Pink Floyd',
    bpm: 63, difficulty: 'medium',
    notes: [n(67),n(64),n(67),n(64),n(69),n(67),n(64),n(62),n(62),n(64),n(67),n(69,2)],
  },
  {
    id: 'shine_on', title: 'Shine On You Crazy Diamond', artist: 'Pink Floyd',
    bpm: 60, difficulty: 'hard',
    notes: [n(62),n(66),n(69),n(74),n(72),n(69),n(67),n(66),n(64),n(62,2)],
  },

  // ── Classic Rock ──────────────────────────────────────────────────────
  {
    id: 'creep', title: 'Creep', artist: 'Radiohead',
    bpm: 92, difficulty: 'medium',
    notes: [n(67),n(71),n(72),n(71),n(70),n(67),n(71),n(72),n(71),n(70,2)],
  },

  // ── Past Two Decades ─────────────────────────────────────────────────
  {
    id: 'seven_nation', title: 'Seven Nation Army', artist: 'The White Stripes',
    bpm: 124, difficulty: 'easy',
    notes: [n(64,1.5),n(64,0.5),n(67),n(64),n(62),n(60),n(59,2),n(64,1.5),n(64,0.5),n(67),n(64),n(62,2)],
  },
  {
    id: 'rolling_deep', title: 'Rolling in the Deep', artist: 'Adele',
    bpm: 104, difficulty: 'medium',
    notes: [n(57),n(60),n(64),n(62),n(60),n(57),n(64),n(62),n(60),n(57,2)],
  },
  {
    id: 'love_story', title: 'Love Story', artist: 'Taylor Swift',
    bpm: 119, difficulty: 'medium',
    notes: [n(67),n(69),n(71),n(69),n(67),n(64),n(62),n(64),n(67),n(69),n(71,2)],
  },
  {
    id: 'do_i_wanna', title: 'Do I Wanna Know?', artist: 'Arctic Monkeys',
    bpm: 85, difficulty: 'hard',
    notes: [n(57,1.5),n(57,0.5),n(62),n(64),n(67),n(69),n(67),n(64),n(62),n(57,2)],
  },
  {
    id: 'under_bridge', title: 'Under the Bridge', artist: 'Red Hot Chili Peppers',
    bpm: 80, difficulty: 'hard',
    notes: [n(62),n(64),n(66),n(69),n(71),n(76),n(74),n(71),n(69),n(66,2)],
  },
  {
    id: 'mr_brightside', title: 'Mr. Brightside', artist: 'The Killers',
    bpm: 148, difficulty: 'hard',
    notes: [n(67),n(69),n(71),n(72),n(74),n(72),n(71),n(69),n(67),n(69),n(71,2)],
  },
];

export const MELODY_IDS = {
  easy:   MELODIES.filter(m => m.difficulty === 'easy').map(m => m.id),
  medium: MELODIES.filter(m => m.difficulty !== 'hard').map(m => m.id),
  hard:   MELODIES.map(m => m.id),
};
