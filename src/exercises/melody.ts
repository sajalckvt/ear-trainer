import { NN } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import { MELODIES, type Melody } from '../data/melodies';
import type { Exercise, AnswerOption, Question } from './types';

interface MelodyPayload {
  melody: Melody;
  blankIndex: number;
  blankMidi: number;
  options: AnswerOption[]; // pre-computed per question (distractors)
}

const MELODY_LEVELS = [
  { n: 'Easy',   melodyIds: ['twinkle'],                       numOptions: 4 },
  { n: 'Medium', melodyIds: ['twinkle', 'ode_to_joy'],         numOptions: 5 },
  { n: 'Hard',   melodyIds: ['twinkle', 'ode_to_joy', 'mary'], numOptions: 6 },
];

// Color per chromatic position (same as pitch exercise)
const NOTE_COLORS = [
  '#818cf8', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#a855f7', '#3b82f6', '#ec4899', '#f43f5e',
  '#8b5cf6', '#06b6d4',
];

function midiToOption(midi: number): AnswerOption {
  const name = NN[((midi % 12) + 12) % 12];
  const offset = ((midi % 12) + 12) % 12;
  return {
    id: midi,
    label: name,
    short: `oct ${Math.floor(midi / 12) - 1}`,
    color: NOTE_COLORS[offset],
    hint: name,
  };
}

function buildOptions(blankMidi: number, melody: Melody, numOptions: number): AnswerOption[] {
  const pool = [...new Set(melody.notes.map((n) => n.midi))].filter((m) => m !== blankMidi);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, numOptions - 1);

  // Pad with semitone neighbours if pool was too small
  let adj = 1;
  while (distractors.length < numOptions - 1) {
    const cand = blankMidi + (distractors.length % 2 === 0 ? adj : -adj);
    if (!distractors.includes(cand) && cand !== blankMidi && cand >= 57 && cand <= 79) {
      distractors.push(cand);
    }
    adj++;
    if (adj > 12) break;
  }

  const all = [blankMidi, ...distractors].sort(() => Math.random() - 0.5);
  return all.map(midiToOption);
}

export const melodyExercise: Exercise<MelodyPayload> = {
  id: 'melody',
  name: 'Melodies',
  levels: MELODY_LEVELS,
  usesDirection: false,

  generate({ levelIndex, recentPicks }) {
    const lv = MELODY_LEVELS[levelIndex];
    const candidates = MELODIES.filter((m) => lv.melodyIds.includes(m.id));
    const melody = candidates[Math.floor(Math.random() * candidates.length)];

    // Avoid first and last note (too obvious), avoid recently blanked indices
    const min = 1;
    const max = melody.notes.length - 2;
    let blankIndex = min + Math.floor(Math.random() * (max - min + 1));
    let attempts = 0;
    while (recentPicks.includes(`${melody.id}_${blankIndex}`) && attempts < 15) {
      blankIndex = min + Math.floor(Math.random() * (max - min + 1));
      attempts++;
    }

    const blankMidi = melody.notes[blankIndex].midi;
    const options = buildOptions(blankMidi, melody, lv.numOptions);

    return {
      root: blankMidi,
      notes: melody.notes.map((n) => n.midi),
      displayLabel: `🎵 ${melody.title} — note ${blankIndex + 1} of ${melody.notes.length} is missing`,
      payload: { melody, blankIndex, blankMidi, options },
      pickId: `${melody.id}_${blankIndex}`,
    };
  },

  play(q, instId: InstrumentId) {
    const { melody, blankIndex } = q.payload as MelodyPayload;
    const beatSec = 60 / melody.bpm;
    let t = 0;
    melody.notes.forEach((note, idx) => {
      if (idx !== blankIndex) {
        pm(instId, note.midi, t);
      }
      // Blank position plays silence — gap in timing cues the user
      t += note.beats * beatSec;
    });
  },

  // Static fallback — the per-question answers come from getQuestionAnswers
  answers(_levelIndex): AnswerOption[] {
    return [];
  },

  getQuestionAnswers(q: Question & { payload: MelodyPayload }): AnswerOption[] {
    return (q.payload as MelodyPayload).options;
  },

  isCorrect(q, guess) {
    return guess === (q.payload as MelodyPayload).blankMidi;
  },

  feedback(answerId) {
    const midi = answerId as number;
    const name = NN[((midi % 12) + 12) % 12];
    const offset = ((midi % 12) + 12) % 12;
    return {
      label: name,
      color: NOTE_COLORS[offset],
      demoPlay: (instId: InstrumentId) => { pm(instId, midi, 0); },
    };
  },
};
