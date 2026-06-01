/**
 * Inversions — identify the position (root / 1st / 2nd) of a chord.
 *
 * The quality is fixed per level (major or minor) so you actually hear it,
 * and the answer is the *position* only. Each chord is arpeggiated low→high
 * then played as a block, so the bass note (which defines the inversion) is
 * audible first.
 *
 *   0 = root position  (root in bass)
 *   1 = first inversion (3rd in bass)
 *   2 = second inversion (5th in bass)
 */

import { CHORDS, SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

interface InversionPayload {
  chordId: string;
  inversion: number;
}

export interface InversionLevel {
  n: string;
  /** single quality id, e.g. 'maj' */
  ch: string;
  /** allowed inversions */
  inv: number[];
}

export const INVERSION_LEVELS: InversionLevel[] = [
  { n: '1st Inv (Major)',       ch: 'maj', inv: [0, 1] },
  { n: '1st & 2nd Inv (Major)', ch: 'maj', inv: [0, 1, 2] },
  { n: '1st Inv (Minor)',       ch: 'min', inv: [0, 1] },
  { n: '1st & 2nd Inv (Minor)', ch: 'min', inv: [0, 1, 2] },
];

const INVERSION_OPTS = [
  { id: 'inv0', label: 'Root position', short: 'Root', color: '#22c55e' },
  { id: 'inv1', label: '1st inversion', short: '1st',  color: '#3b82f6' },
  { id: 'inv2', label: '2nd inversion', short: '2nd',  color: '#a855f7' },
];

function pick<T>(list: readonly T[], recent: ReadonlyArray<T>): T {
  let avail = list.slice() as T[];
  if (avail.length > 2) {
    avail = avail.filter((s) => !recent.slice(-1).includes(s));
    if (avail.length === 0) avail = list.slice();
  }
  return avail[Math.floor(Math.random() * avail.length)];
}

/** Voice a chord in a given inversion, clamped to the soundfont range. */
export function voiceInversion(rootMidi: number, intervals: number[], inv: number): number[] {
  const notes = intervals.map((iv) => rootMidi + iv);
  for (let i = 0; i < inv; i++) notes[i] += 12;
  let voiced = notes.slice().sort((a, b) => a - b);
  while (Math.max(...voiced) > SAMPLE_HI) voiced = voiced.map((n) => n - 12);
  while (Math.min(...voiced) < SAMPLE_LO) voiced = voiced.map((n) => n + 12);
  return voiced;
}

export const inversionExercise: Exercise<InversionPayload> = {
  id: 'inversion',
  name: 'Inversions',
  levels: INVERSION_LEVELS,
  usesDirection: false,

  generate({ levelIndex, keyOffset, recentPicks }) {
    const lv = INVERSION_LEVELS[levelIndex];
    const ch = CHORDS.find((c) => c.id === lv.ch)!;
    const inversion = pick(lv.inv, recentPicks as number[]) as number;

    let rm = 60 + keyOffset;
    const topOffset = Math.max(...ch.iv) + 12;
    while (rm + topOffset > SAMPLE_HI) rm -= 12;
    while (rm < SAMPLE_LO) rm += 12;

    const notes = voiceInversion(rm, ch.iv, inversion);
    return {
      root: rm,
      notes,
      payload: { chordId: lv.ch, inversion },
      pickId: `inv${inversion}`,
      displayLabel: 'Which inversion?',
    };
  },

  play(q, instId: InstrumentId, opts) {
    const humanize = opts?.humanize ?? false;
    const base = opts?.dynamics ?? -1;
    const vel = () =>
      base < 0
        ? 0.55 + Math.random() * 0.45
        : base * (humanize ? 0.85 + Math.random() * 0.15 : 1);
    const ordered = [...q.notes].sort((a, b) => a - b);
    const gap = 0.3;
    ordered.forEach((n, i) => pm(instId, n, i * gap, vel()));
    const chordAt = ordered.length * gap + 0.15;
    ordered.forEach((n) => pm(instId, n, chordAt, vel()));
  },

  answers(levelIndex): AnswerOption[] {
    return INVERSION_LEVELS[levelIndex].inv.map((i) => {
      const o = INVERSION_OPTS[i];
      return { id: o.id, label: o.label, short: o.short, color: o.color };
    });
  },

  isCorrect(q, guess) {
    return guess === `inv${q.payload.inversion}`;
  },

  feedback(answerId) {
    const idx = Number(String(answerId).slice(3));
    const o = INVERSION_OPTS[idx];
    return {
      label: o.label,
      color: o.color,
      // Reference: C major root position, then the same chord in this inversion.
      demoPlay: (instId: InstrumentId) => {
        const root = voiceInversion(60, [0, 4, 7], 0);
        root.forEach((n) => pm(instId, n, 0));
        const inv = voiceInversion(60, [0, 4, 7], idx);
        inv.forEach((n) => pm(instId, n, 1.0));
      },
    };
  },
};
