import { IVS, SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

interface DistancePayload {
  semitones: number;
  noteA: number;
  noteB: number;
}

// Mirror Interval levels exactly — same option sets, same difficulty curve
// "Octave" level: near-octave discrimination (m7 / M7 / P8 / m9 / M9)
const DIST_LEVELS = [
  { n: 'Beginner', iv: [0, 4, 7, 12] },
  { n: 'Easy',     iv: [0, 3, 4, 5, 7, 12] },
  { n: 'Medium',   iv: [0, 2, 3, 4, 5, 6, 7, 9, 12] },
  { n: 'Hard',     iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { n: 'Expert',   iv: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { n: 'Octave',   iv: [10, 11, 12, 13, 14] }, // near-octave: can you tell EXACT octave from near-misses?
] as const;

function pickFrom<T>(list: readonly T[], recent: ReadonlyArray<T>): T {
  let avail = list.slice() as T[];
  if (avail.length > 4) {
    avail = avail.filter((s) => !recent.slice(-2).includes(s));
    if (avail.length === 0) avail = list.slice();
  }
  return avail[Math.floor(Math.random() * avail.length)];
}

function randRange(lo: number, hi: number) {
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

export const distanceExercise: Exercise<DistancePayload> = {
  id: 'distance',
  name: 'Distance',
  levels: DIST_LEVELS,
  usesDirection: false,

  generate({ levelIndex, recentPicks }) {
    const lv = DIST_LEVELS[levelIndex];
    const st = pickFrom(lv.iv as readonly number[], recentPicks as number[]);

    // Properly clamp so BOTH notes land within the soundfont range.
    // Ascending: noteA ∈ [SAMPLE_LO, SAMPLE_HI - st]
    // Descending: noteA ∈ [SAMPLE_LO + st, SAMPLE_HI]
    const canAsc  = SAMPLE_HI - st >= SAMPLE_LO;
    const canDesc = SAMPLE_HI    >= SAMPLE_LO + st;

    let noteA: number;
    let noteB: number;

    if (canAsc && canDesc) {
      // Both directions work — pick randomly
      if (Math.random() < 0.5) {
        noteA = randRange(SAMPLE_LO, SAMPLE_HI - st);
        noteB = noteA + st;
      } else {
        noteA = randRange(SAMPLE_LO + st, SAMPLE_HI);
        noteB = noteA - st;
      }
    } else if (canAsc) {
      noteA = randRange(SAMPLE_LO, SAMPLE_HI - st);
      noteB = noteA + st;
    } else if (canDesc) {
      noteA = randRange(SAMPLE_LO + st, SAMPLE_HI);
      noteB = noteA - st;
    } else {
      // st exceeds soundfont range — play the widest available gap
      noteA = SAMPLE_LO;
      noteB = SAMPLE_HI;
    }

    return {
      root: Math.min(noteA, noteB),
      notes: [noteA, noteB],
      payload: { semitones: st, noteA, noteB },
      pickId: st,
    };
  },

  play(q, instId: InstrumentId) {
    const { noteA, noteB } = q.payload as DistancePayload;
    pm(instId, noteA, 0);
    pm(instId, noteB, 0.75);
  },

  answers(levelIndex): AnswerOption[] {
    const lv = DIST_LEVELS[levelIndex];
    return (lv.iv as readonly number[]).map((st) => {
      const iv = IVS[st];
      if (iv) {
        return { id: st, label: iv.n, short: iv.sh, color: iv.co, hint: `${st}st` };
      }
      return { id: st, label: `${st} semitones`, short: `${st}st`, color: '#818cf8', hint: `${st}st` };
    });
  },

  isCorrect(q, guess) {
    return guess === (q.payload as DistancePayload).semitones;
  },

  isClose(q, guess) {
    return Math.abs((guess as number) - (q.payload as DistancePayload).semitones) === 1;
  },

  getHint(_correctId, guessId) {
    const correct = (_correctId as number);
    const guess   = (guessId as number);
    if (correct > guess) return "You're close! The gap is slightly wider than you thought.";
    return "You're close! The gap is slightly narrower than you thought.";
  },

  feedback(answerId) {
    const st = answerId as number;
    const iv = IVS[st];
    return {
      label: iv?.n ?? `${st} semitones`,
      color: iv?.co ?? '#818cf8',
      reference: iv?.rf,
      altReference: iv?.al,
      demoPlay: (instId: InstrumentId) => {
        // Always demo from a fixed mid-range root so user has a clean reference
        const root = 65; // F4 — comfortably mid-range, both directions work for st≤14
        const target = root + st <= SAMPLE_HI ? root + st : root - st;
        pm(instId, root, 0);
        pm(instId, target, 0.6);
      },
    };
  },
};
