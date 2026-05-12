/**
 * 7th chords — 4-note chord identification exercise.
 *
 * Reuses maj7 / min7 / dom7 definitions from constants.ts so we have one
 * source of truth for those. Adds the remaining 4-note chord qualities.
 *
 * Each chord has a `songs: SongRef[]` list. To add a reference, append a
 * new entry. If you give it a `phrase` (semitone offsets from chord root)
 * and optional `bpm`, the FeedbackSheet renders a ▶ button that plays
 * the hook on the user's instrument, transposed to the question's root.
 */

import type { Chord } from './constants';
import { CHORDS } from './constants';

const baseMaj7 = CHORDS.find((c) => c.id === 'maj7')!;
const baseMin7 = CHORDS.find((c) => c.id === 'min7')!;
const baseDom7 = CHORDS.find((c) => c.id === 'dom7')!;

export const CHORDS_7TH: Chord[] = [
  baseMaj7,
  baseMin7,
  baseDom7,
  {
    id: 'm7b5', n: 'Half-Diminished', sh: 'm7♭5', co: '#a855f7',
    iv: [0, 3, 6, 10], fm: 'R + m3 + ♭5 + m7', fmd: 'm3 + m3 + M3',
    ex: 'Bittersweet, melancholy with tension — the iiø of minor keys',
    songs: [
      {
        title: '"Cry Me a River" — Julie London',
        hint: 'The iiø7 in the ii–V–i — the heart of the song\'s sadness',
        phrase: [0, 3, 6, 10, 6, 3, 0],
        bpm: 80,
      },
      {
        title: '"Black Orpheus" (bossa standard)',
        hint: 'Iconic iiø7 → V7 → i progression in minor',
        phrase: [10, 6, 3, 0],
        bpm: 100,
      },
      {
        title: '"Yesterday" — Beatles (the "Suddenly" moment)',
        hint: 'F♯ø7 lands under "Sud-den-ly" — that aching turn',
        phrase: [0, 3, 6, 10],
        bpm: 90,
      },
    ],
  },
  {
    id: 'dim7', n: 'Diminished 7th', sh: 'dim7', co: '#ef4444',
    iv: [0, 3, 6, 9], fm: 'R + m3 + ♭5 + ♭♭7', fmd: 'm3 + m3 + m3',
    ex: 'Maximum tension — symmetrical, every stack of m3, classic horror chord',
    songs: [
      {
        title: 'Silent-film "tied to the train tracks" sting (full version)',
        hint: 'Symmetric horror chord — every note a m3 apart',
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
        title: 'Looney Tunes "uh-oh" chord',
        hint: 'Cartoon shock-and-tension stinger — pure dim7',
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
        title: '"Stairway to Heaven" — Led Zeppelin (intro line)',
        hint: 'The chromatic descending bass under Am implies mMaj7',
        phrase: [0, 3, 7, 11, 10, 8, 7],
        bpm: 70,
      },
    ],
  },
  {
    id: 'maj7sharp5', n: 'Augmented Major 7th', sh: 'maj7♯5', co: '#f97316',
    iv: [0, 4, 8, 11], fm: 'R + M3 + ♯5 + M7', fmd: 'M3 + M3 + M3',
    ex: 'Otherworldly, dreamlike — every stack of M3 plus a tense M7',
    songs: [
      {
        title: '"Wives and Lovers" — Burt Bacharach',
        hint: 'Drifts through maj7♯5 voicings — that off-kilter dreamy feel',
        phrase: [0, 4, 8, 11, 8, 4, 0],
        bpm: 110,
      },
      {
        title: '"You Are the Sunshine of My Life" — Stevie Wonder',
        hint: 'The opening chord voicing — maj7♯5 ambiguity before resolution',
        phrase: [0, 4, 8, 11],
        bpm: 110,
      },
      {
        title: 'David Lynch / Angelo Badalamenti soundtrack vibe',
        hint: 'That "Twin Peaks" floating-dread chord — pure maj7♯5 colour',
        phrase: [11, 8, 4, 0],
        bpm: 70,
      },
    ],
  },
];

export interface Chord7thLevel { n: string; ch: string[]; }

export const CHORDS_7TH_LEVELS: Chord7thLevel[] = [
  { n: 'Beginner', ch: ['maj7', 'min7', 'dom7'] },
  { n: 'Easy',     ch: ['maj7', 'min7', 'dom7', 'dim7'] },
  { n: 'Medium',   ch: ['maj7', 'min7', 'dom7', 'dim7', 'm7b5'] },
  { n: 'Hard',     ch: ['maj7', 'min7', 'dom7', 'dim7', 'm7b5', 'mMaj7'] },
  { n: 'Expert',   ch: ['maj7', 'min7', 'dom7', 'dim7', 'm7b5', 'mMaj7', 'maj7sharp5'] },
];

// Pairs that share most notes — used for "close" feedback
export const CHORDS_7TH_CLOSE = new Set([
  'maj7_dom7', 'dom7_maj7',
  'min7_dom7', 'dom7_min7',
  'min7_m7b5', 'm7b5_min7',
  'm7b5_dim7', 'dim7_m7b5',
  'min7_mMaj7', 'mMaj7_min7',
  'maj7_maj7sharp5', 'maj7sharp5_maj7',
]);

export const CHORDS_7TH_HINTS: Record<string, string> = {
  'maj7_dom7': 'Close! The top note is one fret different — bluesy (♭7) instead of dreamy (M7).',
  'dom7_maj7': 'Close! The top note is one fret different — dreamy (M7) instead of bluesy (♭7).',
  'min7_m7b5': 'Close! Both are dark and silky. The 5th is lowered, adding tension underneath.',
  'm7b5_dim7': 'Close! Both feel unstable. The top note in dim7 is one fret lower — fully symmetrical.',
  'min7_mMaj7': 'Close! Both are minor underneath. The top note is bright (M7) instead of bluesy (♭7).',
  'maj7_maj7sharp5': 'Close! Both have the dreamy M7 halo. The middle voice is augmented (♯5) here.',
};
