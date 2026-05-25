/**
 * Progression exercise — identify each chord in a played sequence.
 */

import {
  PROGRESSION_CHORD_MAP,
  PROGRESSION_LEVELS,
  SONG_PROGRESSIONS,
} from '../data/progressions';
import { SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

export interface ProgressionPayload {
  chordIds: string[];
  keyRoot: number;
  /** Song metadata if this question came from SONG_PROGRESSIONS */
  song?: { title: string; artist: string; note: string; hasNonDiatonic?: boolean };
}

// ─── Playback timing ────────────────────────────────────────────────────────
export const CHORD_DUR = 1.2;
export const CHORD_GAP = 0.15;
export const CHORD_STEP = CHORD_DUR + CHORD_GAP;

// ─── Helpers ────────────────────────────────────────────────────────────────

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generate a random progression.
 * If fixedLen is provided (1-7), uses exactly that many chords.
 * Otherwise picks randomly between minLen and maxLen.
 */
function generateChordSequence(
  allowed: string[],
  minLen: number,
  maxLen: number,
  fixedLen?: number,
): string[] {
  const len = fixedLen != null
    ? Math.max(2, Math.min(7, fixedLen))
    : minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
  const seq: string[] = [];

  for (let i = 0; i < len; i++) {
    let chId: string;
    if (i === 0 && allowed.includes('I') && Math.random() < 0.6) {
      chId = 'I';
    } else if (i === len - 1 && Math.random() < 0.6) {
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

function voiceChord(chordRoot: number, intervals: number[]): number[] {
  // Find a root octave where the chord fits inside the sample range.
  // For 9th chords (span up to 14 semitones), we allow the top note to
  // exceed SAMPLE_HI by up to 2 semitones rather than collapsing everything.
  let rm = chordRoot;
  const top = Math.max(...intervals);
  while (rm + top > SAMPLE_HI + 2) rm -= 12;
  while (rm < SAMPLE_LO) rm += 12;
  return intervals.map((i) => rm + i);
}

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

  generate({ levelIndex, keyOffset, progressionLength }) {
    const lv = PROGRESSION_LEVELS[levelIndex];

    let keyRoot = 60 + keyOffset;
    while (keyRoot + 17 + 4 > SAMPLE_HI) keyRoot -= 12;
    while (keyRoot < SAMPLE_LO) keyRoot += 12;

    // ── Song progression mode ──────────────────────────────────────────
    if (lv.isSong) {
      const pool = SONG_PROGRESSIONS;
      const song = pick(pool);
      const seq = song.chords;

      const allNotes: number[] = [];
      for (const chId of seq) {
        const ch = PROGRESSION_CHORD_MAP[chId];
        if (!ch) continue;
        const notes = voiceChord(keyRoot + ch.rootOffset, ch.iv);
        allNotes.push(...notes);
      }

      return {
        root: keyRoot,
        notes: allNotes,
        payload: {
          chordIds: seq,
          keyRoot,
          song: {
            title: song.title,
            artist: song.artist,
            note: song.note,
            hasNonDiatonic: song.hasNonDiatonic,
          },
        },
        pickId: `${song.title}-${keyOffset}`,
        displayLabel: `${seq.length} chords · identify each`,
      };
    }

    // ── Random progression mode ───────────────────────────────────────
    const allowed = lv.ch ?? ['I', 'IV', 'V'];
    const seq = generateChordSequence(
      allowed,
      lv.minLen,
      lv.maxLen,
      progressionLength,  // undefined = random
    );

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
      pickId: seq.join(','),
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

  answers(levelIndex): AnswerOption[] {
    const lv = PROGRESSION_LEVELS[levelIndex];

    // For song/non-diatonic levels, return all relevant chords
    if (lv.isSong) {
      // Pool: all chords that appear in any song
      const usedIds = new Set(SONG_PROGRESSIONS.flatMap((s) => s.chords));
      return [...usedIds].map((chId) => {
        const ch = PROGRESSION_CHORD_MAP[chId];
        return {
          id: ch.id,
          label: ch.n,
          short: ch.sh,
          color: ch.co,
          hint: ch.fn,
        };
      });
    }

    const ids = lv.ch ?? ['I', 'IV', 'V'];
    return ids.map((chId) => {
      const ch = PROGRESSION_CHORD_MAP[chId];
      return {
        id: ch.id,
        label: ch.n,
        short: ch.sh,
        color: ch.co,
        hint: ch.fn,
      };
    });
  },

  isCorrect(q, guess) {
    return String(guess) === q.payload.chordIds.join(',');
  },

  feedback(answerId) {
    const ids = String(answerId).split(',');
    const labels = ids.map((id) => PROGRESSION_CHORD_MAP[id]?.n ?? id);
    return {
      label: labels.join(' → '),
      color: '#a78bfa',
    };
  },
};
