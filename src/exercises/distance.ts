import { IVS, SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

interface DistancePayload {
  semitones: number;
  noteA: number;
  noteB: number;
}

// All semitone values up to 2 octaves
const DIST_WITHIN_OCT   = [1,2,3,4,5,6,7,8,9,10,11,12];
const DIST_UP_TO_15     = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
const DIST_UP_TO_18     = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];
const DIST_UP_TO_24     = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24];
const DIST_OCTAVES_ONLY = [12, 24, 36];

const DIST_LEVELS = [
  { n: 'Beginner', iv: DIST_WITHIN_OCT,   fixedRoot: 60,  cross: false },
  { n: 'Easy',     iv: DIST_WITHIN_OCT,   fixedRoot: null, cross: false },
  { n: 'Medium',   iv: DIST_UP_TO_15,     fixedRoot: null, cross: false },
  { n: 'Hard',     iv: DIST_UP_TO_18,     fixedRoot: null, cross: false },
  { n: 'Wide',     iv: DIST_UP_TO_24,     fixedRoot: null, cross: false },
  { n: 'Octaves',  iv: DIST_OCTAVES_ONLY, fixedRoot: null, cross: true  },
];

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

// Answer grid options — intervals up to 24st + octave labels
function octavesAnswers(): AnswerOption[] {
  return [
    { id: 12, label: '1 Octave',  short: '8va',  color: '#6d28d9', hint: '12st' },
    { id: 24, label: '2 Octaves', short: '15ma', color: '#7c3aed', hint: '24st' },
    { id: 36, label: '3 Octaves', short: '22ma', color: '#4c1d95', hint: '36st' },
  ];
}

function semitoneLabel(st: number): string {
  if (IVS[st]) return IVS[st].n;
  return `${st} semitones`;
}

export const distanceExercise: Exercise<DistancePayload> = {
  id: 'distance',
  name: 'Phase 1B: Distance',
  levels: DIST_LEVELS,
  usesDirection: false, // direction is randomised per question

  generate({ levelIndex, recentPicks }) {
    const lv = DIST_LEVELS[levelIndex];
    const st = pickFrom(lv.iv, recentPicks as number[]);

    // Root: fixed C4 on Beginner, otherwise random within a comfortable range
    let noteA: number;
    if (lv.fixedRoot !== null) {
      noteA = lv.fixedRoot;
    } else {
      // Keep both notes within sample range
      const lo = SAMPLE_LO;
      const hi = SAMPLE_HI - st;
      noteA = hi >= lo ? randRange(lo, hi) : SAMPLE_LO;
    }

    // Direction: random (asc or desc), but always keep noteB in sample range
    let noteB = noteA + st;
    if (noteB > SAMPLE_HI) { noteB = noteA - st; }
    if (noteB < SAMPLE_LO) { noteB = noteA + st; }

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
    if (lv.n === 'Octaves') return octavesAnswers();

    return lv.iv.map((st) => {
      const iv = IVS[st];
      if (iv) {
        return { id: st, label: iv.n, short: iv.sh, color: iv.co, hint: `${st}st` };
      }
      // Beyond known intervals (> 14st) — generic label
      const octave = Math.floor(st / 12);
      const remainder = st % 12;
      const remIv = IVS[remainder];
      const label = octave > 0
        ? `${octave} oct + ${remIv?.sh ?? remainder + 'st'}`
        : `${st} semitones`;
      return { id: st, label, short: `${st}st`, color: '#818cf8', hint: `${st}st` };
    });
  },

  isCorrect(q, guess) {
    return guess === (q.payload as DistancePayload).semitones;
  },

  isClose(q, guess) {
    return Math.abs((guess as number) - (q.payload as DistancePayload).semitones) === 1;
  },

  getHint(correctId, guessId) {
    const diff = (correctId as number) - (guessId as number);
    if (diff > 0) return `You're close! The gap is slightly wider than you thought.`;
    return `You're close! The gap is slightly narrower than you thought.`;
  },

  feedback(answerId) {
    const st = answerId as number;
    const iv = IVS[st];
    return {
      label: semitoneLabel(st),
      color: iv?.co ?? '#818cf8',
      reference: iv?.rf,
      altReference: iv?.al,
      demoPlay: (instId: InstrumentId) => {
        pm(instId, 60, 0);
        pm(instId, 60 + st, 0.6);
      },
    };
  },
};
