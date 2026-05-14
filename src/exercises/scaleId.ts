/**
 * Scale identification exercise.
 *
 * Plays a scale ascending then descending from a random root.
 * The user identifies which scale they heard.
 * Note speed is 0.22s per note (same as chord arpeggios in the app).
 */

import { SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import {
  SCALE_MAP,
  SCALE_LEVELS,
  SCALE_CLOSE_PAIRS,
  SCALE_HINTS,
} from '../data/scales';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

const NOTE_DUR = 0.22; // seconds per note

interface ScalePayload {
  scaleId: string;
  keyRoot: number;
}

function pick<T>(list: readonly T[], recent: ReadonlyArray<T>): T {
  let avail = list.slice() as T[];
  if (avail.length > 3) {
    avail = avail.filter((s) => !recent.slice(-2).includes(s));
    if (avail.length === 0) avail = list.slice();
  }
  return avail[Math.floor(Math.random() * avail.length)];
}

export const scaleIdExercise: Exercise<ScalePayload> = {
  id: 'scaleId',
  name: 'Scales',
  levels: SCALE_LEVELS,
  usesDirection: false,

  generate({ levelIndex, keyOffset, recentPicks }) {
    const lv = SCALE_LEVELS[levelIndex];
    const scaleId = pick(lv.scales, recentPicks as string[]);
    const scale = SCALE_MAP[scaleId];

    let keyRoot = 60 + keyOffset;
    const top = Math.max(...scale.intervals);
    while (keyRoot + top > SAMPLE_HI) keyRoot -= 12;
    while (keyRoot < SAMPLE_LO) keyRoot += 12;

    // notes = ascending + descending (excluding repeated octave top)
    const asc = scale.intervals.map((iv) => keyRoot + iv);
    const oct = keyRoot + 12 <= SAMPLE_HI ? [keyRoot + 12] : [];
    const desc = [...scale.intervals].reverse().map((iv) => keyRoot + iv);
    const notes = [...asc, ...oct, ...desc];

    return {
      root: keyRoot,
      notes,
      payload: { scaleId, keyRoot },
      pickId: scaleId,
      displayLabel: 'Ascending + descending scale',
    };
  },

  play(q, instId: InstrumentId) {
    q.notes.forEach((n, i) => pm(instId, n, i * NOTE_DUR));
  },

  answers(levelIndex): AnswerOption[] {
    return SCALE_LEVELS[levelIndex].scales.map((sid) => {
      const s = SCALE_MAP[sid];
      return { id: s.id, label: s.n, short: s.sh, color: s.co, hint: s.signature };
    });
  },

  isCorrect(q, guess) { return guess === q.payload.scaleId; },

  isClose(q, guess) {
    return SCALE_CLOSE_PAIRS.has(`${q.payload.scaleId}_${guess}`);
  },

  getHint(correctId, guessId) {
    return SCALE_HINTS[`${guessId}_${correctId}`]
      ?? 'Close! Listen for the distinctive step near the top of the scale.';
  },

  feedback(answerId) {
    const s = SCALE_MAP[answerId as string];
    return {
      label: s.n,
      color: s.co,
      reference: s.hint,
      songRefs: s.songs.map((song) => ({
        title: song.title,
        hint: song.hint,
      })),
      demoPlay: (instId: InstrumentId) => {
        // Play from C4 ascending + descending
        const root = 60;
        const top = Math.max(...s.intervals);
        const safeRoot = root + top > SAMPLE_HI ? root - 12 : root;
        const asc = s.intervals.map((iv) => safeRoot + iv);
        const oct = safeRoot + 12 <= SAMPLE_HI ? [safeRoot + 12] : [];
        const desc = [...s.intervals].reverse().map((iv) => safeRoot + iv);
        [...asc, ...oct, ...desc].forEach((n, i) => pm(instId, n, i * NOTE_DUR));
      },
    };
  },
};
