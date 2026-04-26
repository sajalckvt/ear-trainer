import { CHORDS, CH_LEVELS, SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

interface TriadPayload {
  chordId: string;
}

function pick<T>(list: readonly T[], recent: ReadonlyArray<T>): T {
  let avail = list.slice() as T[];
  if (avail.length > 3) {
    avail = avail.filter((s) => !recent.slice(-2).includes(s));
    if (avail.length === 0) avail = list.slice();
  }
  return avail[Math.floor(Math.random() * avail.length)];
}

export const triadExercise: Exercise<TriadPayload> = {
  id: 'triad',
  name: 'Phase 2: Triads',
  levels: CH_LEVELS,
  usesDirection: false,

  generate({ levelIndex, keyOffset, recentPicks }) {
    const lv = CH_LEVELS[levelIndex];
    const chId = pick(lv.ch, recentPicks as string[]);
    const ch = CHORDS.find((c) => c.id === chId)!;

    let rm = 60 + keyOffset;
    const topOffset = Math.max(...ch.iv);
    while (rm + topOffset > SAMPLE_HI) rm -= 12;
    while (rm < SAMPLE_LO) rm += 12;

    const notes = ch.iv.map((i) => rm + i);
    return {
      root: rm,
      notes,
      payload: { chordId: chId },
      pickId: chId,
    };
  },

  play(q, instId: InstrumentId) {
    // Arpeggiate up, then play the full chord
    const gap = 0.3;
    q.notes.forEach((n, i) => pm(instId, n, i * gap));
    const chordAt = q.notes.length * gap + 0.15;
    q.notes.forEach((n) => pm(instId, n, chordAt));
  },

  answers(levelIndex): AnswerOption[] {
    return CH_LEVELS[levelIndex].ch.map((chId) => {
      const ch = CHORDS.find((c) => c.id === chId)!;
      return {
        id: ch.id,
        label: ch.n,
        short: ch.sh,
        color: ch.co,
        hint: ch.fmd,
      };
    });
  },

  isCorrect(q, guess) {
    return guess === q.payload.chordId;
  },

  feedback(answerId) {
    const ch = CHORDS.find((c) => c.id === (answerId as string))!;
    return {
      label: ch.n,
      color: ch.co,
      reference: ch.ex,
      altReference: ch.fm,
    };
  },
};
