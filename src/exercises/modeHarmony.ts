/**
 * Modal Harmony exercise — identify the mode from a 2-chord pair.
 *
 * Each question plays the tonic chord of a mode, then the mode's
 * diagnostic chord. The user identifies which mode they're hearing.
 *
 * Pedagogy: every mode has one chord move that distinguishes it.
 * By isolating that single diagnostic pair, the ear learns to
 * recognise the "flavour" before encountering it in full progressions.
 *
 *   Ionian:     I → V    (standard major cadence)
 *   Dorian:     i → IV   (major IV in a minor key — the bright lift)
 *   Phrygian:   i → ♭II  (half-step-up major — exotic/menacing)
 *   Lydian:     I → II   (major II — floating, dreamy)
 *   Mixolydian: I → ♭VII (♭VII major — bluesy rock)
 *   Aeolian:    i → ♭VI  (natural minor's signature move)
 *   Locrian:    i° → ♭II (diminished tonic — unstable, rare)
 */

import { SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import {
  MODE_MAP,
  MODE_LEVELS,
  MODE_CLOSE_PAIRS,
  MODE_HINTS,
  generateModalProgression,
  type DiatonicTriad,
} from '../data/modes';
import { pm, playPhrase, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption, SongRefPlayable } from './types';

interface ModePayload {
  modeId: string;
  keyRoot: number;
  /** The 4-chord progression that was played (for replay). */
  progression: DiatonicTriad[];
}

function pick<T>(list: readonly T[], recent: ReadonlyArray<T>): T {
  let avail = list.slice() as T[];
  if (avail.length > 3) {
    avail = avail.filter((s) => !recent.slice(-2).includes(s));
    if (avail.length === 0) avail = list.slice();
  }
  return avail[Math.floor(Math.random() * avail.length)];
}

function voiceChord(root: number, intervals: number[]): number[] {
  let rm = root;
  const top = Math.max(...intervals);
  while (rm + top > SAMPLE_HI) rm -= 12;
  while (rm < SAMPLE_LO) rm += 12;
  return intervals.map((i) => rm + i);
}

const CHORD_STEP = 1.35; // seconds between chord starts (matches progression exercise)

export const modeHarmonyExercise: Exercise<ModePayload> = {
  id: 'modeHarmony',
  name: 'Modal Harmony',
  levels: MODE_LEVELS,
  usesDirection: false,

  generate({ levelIndex, keyOffset, recentPicks, modeChordCount }) {
    const lv = MODE_LEVELS[levelIndex];
    const modeId = pick(lv.modes, recentPicks as string[]);
    const mode = MODE_MAP[modeId];
    const chordCount = modeChordCount ?? 2;

    let keyRoot = 60 + keyOffset;
    // Clamp — the widest chord could be degree 6 (rootOffset ~11) + P5 (7) = 18 above key root
    while (keyRoot + 18 > SAMPLE_HI) keyRoot -= 12;
    while (keyRoot < SAMPLE_LO) keyRoot += 12;

    // Generate a progression using the mode's diatonic triads
    const progression = generateModalProgression(mode, chordCount);

    // Collect all notes for piano highlight after answer
    const allNotes: number[] = [];
    for (const ch of progression) {
      allNotes.push(...voiceChord(keyRoot + ch.rootOffset, ch.iv));
    }

    return {
      root: keyRoot,
      notes: allNotes,
      payload: { modeId, keyRoot, progression },
      pickId: modeId,
      displayLabel: `${chordCount}-chord modal progression`,
    };
  },

  play(q, instId: InstrumentId) {
    const { keyRoot, progression } = q.payload;

    progression.forEach((ch, idx) => {
      const notes = voiceChord(keyRoot + ch.rootOffset, ch.iv);
      const startAt = idx * CHORD_STEP;
      notes.forEach((n) => pm(instId, n, startAt));
    });
  },

  answers(levelIndex): AnswerOption[] {
    return MODE_LEVELS[levelIndex].modes.map((mId) => {
      const m = MODE_MAP[mId];
      return {
        id: m.id,
        label: m.n,
        short: m.sh,
        color: m.co,
        hint: m.signature,
      };
    });
  },

  isCorrect(q, guess) { return guess === q.payload.modeId; },

  isClose(q, guess) {
    return MODE_CLOSE_PAIRS.has(`${q.payload.modeId}_${guess}`);
  },

  getHint(correctId, guessId) {
    const key = `${guessId}_${correctId}`;
    return MODE_HINTS[key] ?? 'Close! Listen for the chord that doesn\'t belong to a standard major or minor key.';
  },

  feedback(answerId) {
    const mode = MODE_MAP[answerId as string];
    const songRefs: SongRefPlayable[] = mode.songs.map((s) => ({
      title: s.title,
      hint: s.hint,
      play: s.phrase
        ? (instId, rootMidi) => playPhrase(instId, rootMidi, s.phrase!, s.bpm)
        : undefined,
    }));
    return {
      label: mode.n,
      color: mode.co,
      reference: mode.hint,
      songRefs,
      demoPlay: (instId: InstrumentId) => {
        // Play a fresh 4-chord modal progression from C4
        const prog = generateModalProgression(mode);
        prog.forEach((ch, idx) => {
          const notes = voiceChord(60 + ch.rootOffset, ch.iv);
          notes.forEach((n) => pm(instId, n, idx * CHORD_STEP));
        });
      },
    };
  },
};
