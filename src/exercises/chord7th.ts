/**
 * 7th chords — identify 4-note chord quality.
 *
 * Same shape as triad exercise but with a 4-note vocabulary.
 * Plays the chord arpeggiated, then again as a stacked chord.
 */

import { SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import {
  CHORDS_7TH,
  CHORDS_7TH_LEVELS,
  CHORDS_7TH_CLOSE,
  CHORDS_7TH_HINTS,
} from '../data/chords7th';
import { pm, playPhrase, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption, SongRefPlayable } from './types';

interface Chord7thPayload { chordId: string; }

function pick<T>(list: readonly T[], recent: ReadonlyArray<T>): T {
  let avail = list.slice() as T[];
  if (avail.length > 3) {
    avail = avail.filter((s) => !recent.slice(-2).includes(s));
    if (avail.length === 0) avail = list.slice();
  }
  return avail[Math.floor(Math.random() * avail.length)];
}

function makeDemo(intervals: number[]) {
  return (instId: InstrumentId) => {
    intervals.forEach((i, idx) => pm(instId, 60 + i, idx * 0.22));
    const t = intervals.length * 0.22 + 0.1;
    intervals.forEach((i) => pm(instId, 60 + i, t));
  };
}

export const chord7thExercise: Exercise<Chord7thPayload> = {
  id: 'chord7th',
  name: '7th Chords',
  levels: CHORDS_7TH_LEVELS,
  usesDirection: false,

  generate({ levelIndex, keyOffset, recentPicks }) {
    const lv = CHORDS_7TH_LEVELS[levelIndex];
    const chId = pick(lv.ch, recentPicks as string[]);
    const ch = CHORDS_7TH.find((c) => c.id === chId)!;

    let rm = 60 + keyOffset;
    const topOffset = Math.max(...ch.iv);
    while (rm + topOffset > SAMPLE_HI) rm -= 12;
    while (rm < SAMPLE_LO) rm += 12;

    const notes = ch.iv.map((i) => rm + i);
    return { root: rm, notes, payload: { chordId: chId }, pickId: chId };
  },

  play(q, instId: InstrumentId) {
    const gap = 0.3;
    q.notes.forEach((n, i) => pm(instId, n, i * gap));
    const chordAt = q.notes.length * gap + 0.15;
    q.notes.forEach((n) => pm(instId, n, chordAt));
  },

  answers(levelIndex): AnswerOption[] {
    return CHORDS_7TH_LEVELS[levelIndex].ch.map((chId) => {
      const ch = CHORDS_7TH.find((c) => c.id === chId)!;
      return { id: ch.id, label: ch.n, short: ch.sh, color: ch.co, hint: ch.fmd };
    });
  },

  isCorrect(q, guess) { return guess === q.payload.chordId; },

  isClose(q, guess) {
    return CHORDS_7TH_CLOSE.has(`${q.payload.chordId}_${guess}`);
  },

  getHint(correctId, guessId) {
    const key = `${guessId}_${correctId}`;
    return CHORDS_7TH_HINTS[key] ?? 'Close! Listen again for the colour of the top note.';
  },

  feedback(answerId) {
    const ch = CHORDS_7TH.find((c) => c.id === (answerId as string))!;
    const songRefs: SongRefPlayable[] = ch.songs.map((s) => ({
      title: s.title,
      hint: s.hint,
      play: s.phrase
        ? (instId, rootMidi) => playPhrase(instId, rootMidi, s.phrase!, s.bpm)
        : undefined,
    }));
    return {
      label: ch.n,
      color: ch.co,
      songRefs,
      demoPlay: makeDemo(ch.iv),
    };
  },
};
