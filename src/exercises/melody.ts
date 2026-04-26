import { NN } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import { MELODIES, MELODY_IDS, type Melody } from '../data/melodies';
import type { Exercise, AnswerOption, Question } from './types';

export interface MelodyPayload {
  melody: Melody;
  blankIndices: number[];
  answerMidis: number[];
}

const MELODY_LEVELS = [
  { n: 'Easy',   ids: MELODY_IDS.easy,   blanks: 1, extra: 5 },
  { n: 'Medium', ids: MELODY_IDS.medium, blanks: 2, extra: 3 },
  { n: 'Hard',   ids: MELODY_IDS.hard,   blanks: 3, extra: 2 },
  { n: 'Expert', ids: MELODY_IDS.hard,   blanks: 5, extra: 0 },
];

/** Pick `count` blank positions spread across [1 .. n-2] */
function spreadBlanks(n: number, count: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const lo = Math.max(1, Math.floor((i / count) * n));
    const hi = Math.min(n - 2, Math.floor(((i + 1) / count) * n) - 1);
    const range = Math.max(0, hi - lo);
    let idx = lo + Math.floor(Math.random() * (range + 1));
    let tries = 0;
    while (result.includes(idx) && tries++ < 10) idx = lo + Math.floor(Math.random() * (range + 1));
    result.push(idx);
  }
  return result.sort((a, b) => a - b);
}

export const melodyExercise: Exercise<MelodyPayload> = {
  id: 'melody',
  name: 'Melodies',
  levels: MELODY_LEVELS,
  usesDirection: false,

  generate({ levelIndex }) {
    const lv = MELODY_LEVELS[levelIndex];
    const pool = MELODIES.filter(m => lv.ids.includes(m.id));
    const melody = pool[Math.floor(Math.random() * pool.length)];
    const blankIndices = spreadBlanks(melody.notes.length, lv.blanks);
    const correctMidis = blankIndices.map(i => melody.notes[i].midi);

    // Distractors: other notes from the melody (contextually plausible)
    const uniqueMidis = [...new Set(melody.notes.map(n => n.midi))];
    const distractors = uniqueMidis
      .filter(m => !correctMidis.includes(m))
      .sort(() => Math.random() - 0.5)
      .slice(0, lv.extra);

    // Pad with semitone neighbours if not enough unique melody notes
    let adj = 1;
    while (distractors.length < lv.extra) {
      const cand = correctMidis[0] + (distractors.length % 2 === 0 ? adj : -adj);
      if (!distractors.includes(cand) && !correctMidis.includes(cand) && cand >= 57 && cand <= 79)
        distractors.push(cand);
      adj++;
      if (adj > 12) break;
    }

    const answerMidis = [...correctMidis, ...distractors].sort(() => Math.random() - 0.5);

    return {
      root: melody.notes[0].midi,
      notes: melody.notes.map(n => n.midi),
      displayLabel: `🎵 ${melody.title} — ${melody.artist}`,
      payload: { melody, blankIndices, answerMidis },
      pickId: `${melody.id}_${blankIndices.join('_')}`,
    };
  },

  play(q, instId: InstrumentId) {
    const { melody, blankIndices } = q.payload as MelodyPayload;
    const beatSec = 60 / melody.bpm;
    let t = 0;
    melody.notes.forEach((note, idx) => {
      if (!blankIndices.includes(idx)) pm(instId, note.midi, t);
      t += note.beats * beatSec;
    });
  },

  answers() { return []; },

  getQuestionAnswers(q: Question & { payload: MelodyPayload }): AnswerOption[] {
    return (q.payload as MelodyPayload).answerMidis.map((midi, i) => ({
      id: `${midi}_${i}`,
      label: NN[((midi % 12) + 12) % 12],
      short: '',
      color: '#818cf8',
    }));
  },

  isCorrect(_q, guess) { return guess === 'complete_clean'; },
  feedback() { return { label: '', color: '#22c55e' }; },
};

export function playMelodyFull(
  melody: Melody,
  assignments: Record<number, number | null>,
  instId: InstrumentId,
) {
  const beatSec = 60 / melody.bpm;
  let t = 0;
  melody.notes.forEach((note, idx) => {
    const midi = assignments[idx] !== undefined ? assignments[idx] : note.midi;
    if (midi !== null) pm(instId, midi as number, t);
    t += note.beats * beatSec;
  });
}
