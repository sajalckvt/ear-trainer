import { IVS, IV_LEVELS, SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

interface IntervalPayload {
  semitones: number;
  direction: 'asc' | 'desc';
}

function pick<T>(list: readonly T[], recent: ReadonlyArray<T>): T {
  let avail = list.slice() as T[];
  if (avail.length > 3) {
    avail = avail.filter((s) => !recent.slice(-2).includes(s));
    if (avail.length === 0) avail = list.slice();
  }
  return avail[Math.floor(Math.random() * avail.length)];
}

export const intervalExercise: Exercise<IntervalPayload> = {
  id: 'interval',
  name: 'Phase 1: Intervals',
  levels: IV_LEVELS,
  usesDirection: true,

  generate({ levelIndex, keyOffset, direction, recentPicks }) {
    const lv = IV_LEVELS[levelIndex];
    const st = pick(lv.iv, recentPicks as number[]);

    // Root = selected key in octave 4 (MIDI 60 = C4)
    let rm = 60 + keyOffset;

    // Clamp to sample range when asc/desc would fall outside
    if (direction === 'asc') {
      if (rm + st > SAMPLE_HI) rm = SAMPLE_HI - st;
    } else {
      if (rm - st < SAMPLE_LO) rm = SAMPLE_LO + st;
    }
    const tg = direction === 'asc' ? rm + st : rm - st;

    return {
      root: rm,
      notes: [rm, tg],
      payload: { semitones: st, direction },
      pickId: st,
    };
  },

  play(q, instId: InstrumentId) {
    pm(instId, q.notes[0], 0);
    pm(instId, q.notes[1], 0.75);
  },

  answers(levelIndex): AnswerOption[] {
    return IV_LEVELS[levelIndex].iv.map((s) => {
      const iv = IVS[s];
      return {
        id: s,
        label: iv.n,
        short: iv.sh,
        color: iv.co,
        hint: `${s}st`,
      };
    });
  },

  isCorrect(q, guess) {
    return guess === q.payload.semitones;
  },

  feedback(answerId) {
    const iv = IVS[answerId as number];
    return {
      label: iv.n,
      color: iv.co,
      reference: iv.rf,
      altReference: iv.al,
    };
  },
};
