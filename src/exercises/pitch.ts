import { NN } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

interface PitchPayload {
  midi: number;
  withReference: boolean;
}

// White key offsets within an octave (C D E F G A B)
const WHITE = [0, 2, 4, 5, 7, 9, 11];

const PITCH_LEVELS = [
  { n: 'Easy',   withRef: true,  chromatic: false }, // 7 white keys + C4 reference
  { n: 'Medium', withRef: true,  chromatic: true  }, // all 12 + C4 reference
  { n: 'Hard',   withRef: false, chromatic: false }, // 7 white keys, no reference
  { n: 'Expert', withRef: false, chromatic: true  }, // all 12, no reference (absolute pitch)
];

// Color per chromatic position (mirrors interval colors loosely)
const NOTE_COLORS = [
  '#818cf8', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#a855f7', '#3b82f6', '#ec4899', '#f43f5e',
  '#8b5cf6', '#06b6d4',
];

export const pitchExercise: Exercise<PitchPayload> = {
  id: 'pitch',
  name: 'Pitch ID',
  levels: PITCH_LEVELS,
  usesDirection: false,

  generate({ levelIndex }) {
    const lv = PITCH_LEVELS[levelIndex];
    const pool = lv.chromatic
      ? Array.from({ length: 12 }, (_, i) => 60 + i) // C4–B4
      : WHITE.map((o) => 60 + o);                     // C4 D4 E4 F4 G4 A4 B4

    const midi = pool[Math.floor(Math.random() * pool.length)];
    const noteName = NN[((midi % 12) + 12) % 12];

    return {
      root: midi,
      notes: [midi],
      displayLabel: lv.withRef
        ? '🎵 C4 played first as reference — what note follows?'
        : '🎵 What note is this?',
      payload: { midi, withReference: lv.withRef },
      pickId: noteName,
    };
  },

  play(q, instId: InstrumentId) {
    const { midi, withReference } = q.payload as PitchPayload;
    if (withReference) {
      pm(instId, 60, 0);      // C4 reference
      pm(instId, midi, 1.1);  // target after brief pause
    } else {
      pm(instId, midi, 0);
    }
  },

  answers(levelIndex): AnswerOption[] {
    const lv = PITCH_LEVELS[levelIndex];
    const offsets = lv.chromatic ? Array.from({ length: 12 }, (_, i) => i) : WHITE;
    return offsets.map((offset) => ({
      id: NN[offset],
      label: NN[offset],
      short: WHITE.includes(offset) ? '♮' : '♭',
      color: NOTE_COLORS[offset],
    }));
  },

  isCorrect(q, guess) {
    const { midi } = q.payload as PitchPayload;
    return guess === NN[((midi % 12) + 12) % 12];
  },

  feedback(answerId) {
    const name = answerId as string;
    const offset = (NN as readonly string[]).indexOf(name);
    return {
      label: name,
      color: NOTE_COLORS[offset >= 0 ? offset : 0],
      reference: offset >= 0 ? `${name} — ${60 + offset} MIDI (C4 octave)` : undefined,
      demoPlay: (instId: InstrumentId) => {
        pm(instId, 60 + (offset >= 0 ? offset : 0), 0);
      },
    };
  },
};
