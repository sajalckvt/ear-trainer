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

// Close miss = within 1 semitone
const INTERVAL_HINTS: Record<string, string> = {
  '3_4':  'You heard something close! This one is slightly wider and brighter than a minor third.',
  '4_3':  'You heard something close! This one is a touch darker and tighter than a major third.',
  '4_5':  'Close! A perfect fourth has a more "open" feel — like a question hanging in the air.',
  '5_4':  'Close! A major third has a warmer, more resolved feel than a perfect fourth.',
  '2_3':  'Close! A minor third has a distinctly darker colour — listen for the minor quality.',
  '3_2':  'Close! A major second is a simple step, thinner and more direct than a minor third.',
  '7_8':  'Close! A minor sixth has a slightly softer, less heroic quality than a perfect fifth.',
  '8_7':  'Close! A perfect fifth is strong and open — a minor sixth has a more wistful bend.',
  '11_12':'Close! An octave leaps cleanly to the same note — a major seventh stops just short.',
  '12_11':'Close! A major seventh has a tantalising "not quite home" tension just before the octave.',
};

function hintKey(correct: number, guess: number) {
  return `${correct}_${guess}`;
}

export const intervalExercise: Exercise<IntervalPayload> = {
  id: 'interval',
  name: 'Intervals',
  levels: IV_LEVELS,
  usesDirection: true,

  generate({ levelIndex, keyOffset, direction, recentPicks }) {
    const lv = IV_LEVELS[levelIndex];
    const st = pick(lv.iv, recentPicks as number[]);

    let rm = 60 + keyOffset;
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
      return { id: s, label: iv.n, short: iv.sh, color: iv.co, hint: `${s}st` };
    });
  },

  isCorrect(q, guess) {
    return guess === q.payload.semitones;
  },

  isClose(q, guess) {
    return Math.abs((guess as number) - q.payload.semitones) === 1;
  },

  getHint(correctId, guessId) {
    const key = hintKey(correctId as number, guessId as number);
    return INTERVAL_HINTS[key] ?? 'You\'re close! Listen carefully to the width of the gap.';
  },

  feedback(answerId) {
    const iv = IVS[answerId as number];
    const st = iv.st;
    return {
      label: iv.n,
      color: iv.co,
      reference: iv.rf,
      altReference: iv.al,
      demoPlay: (instId: InstrumentId) => {
        pm(instId, 60, 0);
        pm(instId, 60 + st, 0.6);
      },
    };
  },
};
