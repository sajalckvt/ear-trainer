/**
 * Progression exercise — identify each chord in a played sequence.
 *
 * Question: a 3-4 chord progression in some major key. The progression is
 * generated dynamically by picking chords from the level's vocabulary, with
 * mild musical biases (start on I more often, end on I or V).
 *
 * Answer: a comma-separated string of Roman-numeral ids that matches the
 * progression exactly. The user builds this string slot-by-slot in the
 * answer UI; once all slots are filled the full string is submitted.
 *
 * Why a single string? The existing Exercise.isCorrect interface takes one
 * guess value. We encode multi-slot answers as joined strings to fit the
 * interface without churning every exercise. The string format is
 * "id1,id2,id3,id4" — e.g. "I,IV,V,I".
 */

import {
  PROGRESSION_CHORD_MAP,
  PROGRESSION_LEVELS,
} from '../data/progressions';
import { SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

export interface ProgressionPayload {
  /** Ordered list of chord ids that make up the progression. */
  chordIds: string[];
  /** MIDI value of the key's tonic (root of I). */
  keyRoot: number;
}

// ─── Playback timing ────────────────────────────────────────────────────────
// Exported so the UI can sync animations to the audio.
export const CHORD_DUR = 1.2;   // seconds the chord rings
export const CHORD_GAP = 0.15;  // pause before the next chord
/** Total time between successive chord starts. */
export const CHORD_STEP = CHORD_DUR + CHORD_GAP;

// ─── Helpers ────────────────────────────────────────────────────────────────

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generate a progression. Picks length, then picks chords with these biases:
 *   - 60% chance the first chord is the I chord (anchors the key)
 *   - 60% chance the last chord is I or V (musical resolution)
 *   - No immediate repeats (don't pick I twice in a row)
 *
 * Returns a list of chord ids drawn from the level's vocabulary.
 */
function generateChordSequence(allowed: string[], minLen: number, maxLen: number): string[] {
  const len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
  const seq: string[] = [];

  for (let i = 0; i < len; i++) {
    let chId: string;
    if (i === 0 && allowed.includes('I') && Math.random() < 0.6) {
      chId = 'I';
    } else if (i === len - 1 && Math.random() < 0.6) {
      // Pick I or V if available, otherwise fall through
      const enders = ['I', 'V'].filter((id) => allowed.includes(id) && id !== seq[i - 1]);
      chId = enders.length > 0 ? pick(enders) : pick(allowed.filter((id) => id !== seq[i - 1]));
    } else {
      const choices = allowed.filter((id) => id !== seq[i - 1]);
      chId = pick(choices.length > 0 ? choices : allowed);
    }
    seq.push(chId);
  }
  return seq;
}

/**
 * Voice a chord around middle C, range-clamped to SAMPLE_LO..SAMPLE_HI.
 * Drops the lowest octave if the chord runs too high.
 */
function voiceChord(chordRoot: number, intervals: number[]): number[] {
  let rm = chordRoot;
  const top = Math.max(...intervals);
  while (rm + top > SAMPLE_HI) rm -= 12;
  while (rm < SAMPLE_LO) rm += 12;
  return intervals.map((i) => rm + i);
}

/**
 * MIDI notes for a specific chord slot in a progression question.
 * Used to drive the piano/fretboard highlights as the progression plays.
 */
export function progressionChordNotes(
  q: { payload: ProgressionPayload },
  idx: number,
): number[] {
  const { chordIds, keyRoot } = q.payload;
  const chId = chordIds[idx];
  if (!chId) return [];
  const ch = PROGRESSION_CHORD_MAP[chId];
  return voiceChord(keyRoot + ch.rootOffset, ch.iv);
}

/**
 * Play just one chord from the progression — used for the post-answer
 * step-through where the user taps slots to re-hear individual chords.
 */
export function playProgressionChord(
  q: { payload: ProgressionPayload },
  idx: number,
  instId: InstrumentId,
): void {
  const notes = progressionChordNotes(q, idx);
  notes.forEach((n) => pm(instId, n, 0));
}

// ─── Exercise ────────────────────────────────────────────────────────────────

export const progressionExercise: Exercise<ProgressionPayload> = {
  id: 'progression',
  name: 'Progressions',
  levels: PROGRESSION_LEVELS,
  usesDirection: false,

  generate({ levelIndex, keyOffset }) {
    const lv = PROGRESSION_LEVELS[levelIndex];
    const seq = generateChordSequence(lv.ch, lv.minLen, lv.maxLen);

    // Key tonic — middle C plus the key offset, clamped to a reasonable range
    let keyRoot = 60 + keyOffset;
    // Make sure even the highest chord (e.g. vii°) fits — vii° is rootOffset 11 + iv[2]=6 = 17 above key root
    while (keyRoot + 17 + 4 > SAMPLE_HI) keyRoot -= 12;
    while (keyRoot < SAMPLE_LO) keyRoot += 12;

    // Concatenate all notes (in playback order) into the question's notes array,
    // so the highlight system has something to render on the piano.
    const allNotes: number[] = [];
    for (const chId of seq) {
      const ch = PROGRESSION_CHORD_MAP[chId];
      const notes = voiceChord(keyRoot + ch.rootOffset, ch.iv);
      allNotes.push(...notes);
    }

    return {
      root: keyRoot,
      notes: allNotes,
      payload: { chordIds: seq, keyRoot },
      pickId: seq.join(','),  // dedupes recent picks at the sequence level
      displayLabel: `${seq.length}-chord progression`,
    };
  },

  play(q, instId: InstrumentId) {
    const { chordIds, keyRoot } = q.payload;

    chordIds.forEach((chId, idx) => {
      const ch = PROGRESSION_CHORD_MAP[chId];
      const notes = voiceChord(keyRoot + ch.rootOffset, ch.iv);
      const startAt = idx * CHORD_STEP;
      notes.forEach((n) => pm(instId, n, startAt));
    });
  },

  // Per-slot chord choices — the same answer set for every slot. The slot
  // UI in TrainPage uses this list directly.
  answers(levelIndex): AnswerOption[] {
    return PROGRESSION_LEVELS[levelIndex].ch.map((chId) => {
      const ch = PROGRESSION_CHORD_MAP[chId];
      return {
        id: ch.id,
        label: ch.n,
        short: ch.sh,
        color: ch.co,
        hint: ch.fn,  // "tonic" / "subdominant" / "dominant"
      };
    });
  },

  isCorrect(q, guess) {
    return String(guess) === q.payload.chordIds.join(',');
  },

  feedback(answerId) {
    // answerId here will be the full comma-joined string of the *correct*
    // answer (TrainPage passes it through after submission). We render a
    // multi-line "the progression was: I → IV → V → I" feedback.
    const ids = String(answerId).split(',');
    const labels = ids.map((id) => PROGRESSION_CHORD_MAP[id]?.n ?? id);
    return {
      label: labels.join(' → '),
      color: '#a78bfa',
      // No demoPlay — the user already heard it; if they want to re-hear,
      // they have the Hear Again button.
    };
  },
};
