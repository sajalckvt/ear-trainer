import { NN } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import { MELODIES, type Melody } from '../data/melodies';
import type { Exercise, AnswerOption, Question } from './types';

export interface MelodyPayload {
  melody: Melody;
  blankIndices: number[];  // sorted positions of the blanks
  answerMidis: number[];   // correct notes + distractors (shuffled)
}

const MELODY_LEVELS = [
  { n: 'Easy',   melodyIds: ['twinkle'],                       blanks: 1, extra: 5 },
  { n: 'Medium', melodyIds: ['twinkle', 'ode_to_joy'],          blanks: 2, extra: 3 },
  { n: 'Hard',   melodyIds: ['twinkle', 'ode_to_joy', 'mary'], blanks: 3, extra: 2 },
  { n: 'Expert', melodyIds: ['twinkle', 'ode_to_joy', 'mary'], blanks: 5, extra: 0 },
];

/** Pick `count` indices spread across [1 .. n-2], not repeating */
function spreadBlanks(n: number, count: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const lo = Math.max(1, Math.floor((i / count) * n));
    const hi = Math.min(n - 2, Math.floor(((i + 1) / count) * n) - 1);
    const range = Math.max(0, hi - lo);
    let idx = lo + Math.floor(Math.random() * (range + 1));
    // avoid collisions
    while (result.includes(idx) && range > 0) idx = lo + Math.floor(Math.random() * (range + 1));
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
    const pool = MELODIES.filter((m) => lv.melodyIds.includes(m.id));
    const melody = pool[Math.floor(Math.random() * pool.length)];
    const blankIndices = spreadBlanks(melody.notes.length, lv.blanks);

    const correctMidis = blankIndices.map((i) => melody.notes[i].midi);

    // Distractors: notes that appear in the melody but are NOT correct notes for any blank
    const melodyMidis = [...new Set(melody.notes.map((n) => n.midi))];
    const distractorPool = melodyMidis
      .filter((m) => !correctMidis.includes(m))
      .sort(() => Math.random() - 0.5);
    const distractors = distractorPool.slice(0, lv.extra);
    // Pad with semitone neighbours if needed
    let adj = 1;
    while (distractors.length < lv.extra) {
      const cand = correctMidis[0] + adj;
      if (!distractors.includes(cand) && !correctMidis.includes(cand) && cand >= 57 && cand <= 79) distractors.push(cand);
      adj++;
      if (adj > 12) break;
    }

    const answerMidis = [...correctMidis, ...distractors].sort(() => Math.random() - 0.5);

    return {
      root: melody.notes[0].midi,
      notes: melody.notes.map((n) => n.midi),
      displayLabel: `🎵 ${melody.title}`,
      payload: { melody, blankIndices, answerMidis },
      pickId: `${melody.id}_${blankIndices.join('_')}`,
    };
  },

  /** Play melody with gaps at blank positions. */
  play(q, instId: InstrumentId) {
    const { melody, blankIndices } = q.payload as MelodyPayload;
    const beatSec = 60 / melody.bpm;
    let t = 0;
    melody.notes.forEach((note, idx) => {
      if (!blankIndices.includes(idx)) pm(instId, note.midi, t);
      t += note.beats * beatSec;
    });
  },



  answers() { return []; },  // MelodyBoard handles its own answer UI

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
  melody: import('../data/melodies').Melody,
  assignments: Record<number, number | null>,
  instId: import('../audio/engine').InstrumentId,
) {
  const beatSec = 60 / melody.bpm;
  let t = 0;
  melody.notes.forEach((note, idx) => {
    const midi = assignments[idx] !== undefined ? assignments[idx] : note.midi;
    if (midi !== null) pm(instId, midi as number, t);
    t += note.beats * beatSec;
  });
}
