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
} from '../data/modes';
import { pm, playPhrase, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption, SongRefPlayable } from './types';

interface ModePayload {
  modeId: string;
  keyRoot: number;
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

export const modeHarmonyExercise: Exercise<ModePayload> = {
  id: 'modeHarmony',
  name: 'Modal Harmony',
  levels: MODE_LEVELS,
  usesDirection: false,

  generate({ levelIndex, keyOffset, recentPicks }) {
    const lv = MODE_LEVELS[levelIndex];
    const modeId = pick(lv.modes, recentPicks as string[]);
    const mode = MODE_MAP[modeId];

    let keyRoot = 60 + keyOffset;
    // Clamp so both tonic and diagnostic chords fit in the soundfont range
    const maxOffset = Math.max(
      ...mode.tonic.iv.map((i) => mode.tonic.rootOffset + i),
      ...mode.diagnostic.iv.map((i) => mode.diagnostic.rootOffset + i),
    );
    while (keyRoot + maxOffset > SAMPLE_HI) keyRoot -= 12;
    while (keyRoot < SAMPLE_LO) keyRoot += 12;

    // Notes: tonic chord + diagnostic chord (for piano highlights after answer)
    const tonicNotes = voiceChord(keyRoot + mode.tonic.rootOffset, mode.tonic.iv);
    const diagNotes = voiceChord(keyRoot + mode.diagnostic.rootOffset, mode.diagnostic.iv);

    return {
      root: keyRoot,
      notes: [...tonicNotes, ...diagNotes],
      payload: { modeId, keyRoot },
      pickId: modeId,
    };
  },

  play(q, instId: InstrumentId) {
    const { modeId, keyRoot } = q.payload;
    const mode = MODE_MAP[modeId];

    // Play tonic chord (stacked), pause, then diagnostic chord (stacked)
    const tonicNotes = voiceChord(keyRoot + mode.tonic.rootOffset, mode.tonic.iv);
    const diagNotes = voiceChord(keyRoot + mode.diagnostic.rootOffset, mode.diagnostic.iv);

    // Tonic at t=0
    tonicNotes.forEach((n) => pm(instId, n, 0));
    // Diagnostic at t=1.2s
    diagNotes.forEach((n) => pm(instId, n, 1.2));
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
    return MODE_HINTS[key] ?? 'Close! Listen to the second chord — it\'s the diagnostic move that defines the mode.';
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
        // Play the diagnostic pair from C4
        const tonicNotes = voiceChord(60 + mode.tonic.rootOffset, mode.tonic.iv);
        const diagNotes = voiceChord(60 + mode.diagnostic.rootOffset, mode.diagnostic.iv);
        tonicNotes.forEach((n) => pm(instId, n, 0));
        diagNotes.forEach((n) => pm(instId, n, 1.2));
      },
    };
  },
};
