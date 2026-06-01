/**
 * Name the Chord — a *visual* exercise.
 *
 * The question shows a chord spelled out as note names (e.g. "C E G") and
 * also highlighted on the piano. The user reads the notes and picks the
 * chord name. Audio is optional before answering (the Replay button) and
 * auto-plays on reveal.
 *
 * Levels grow the vocabulary:
 *   Triads:      maj, min, dim, aug, sus2, sus4
 *   + 7ths:      adds maj7, min7, dom7, m7b5, dim7
 *   + Inversions: same chords, but voiced in an inversion → named as a
 *                 slash chord (e.g. C/E for C major, 1st inversion).
 *
 * Because the answer is the chord *name* (optionally with a bass note),
 * pickId encodes both: "maj" for root position, "maj/E" for an inversion.
 */

import { CHORDS, SAMPLE_LO, SAMPLE_HI, ND } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

interface SpellingPayload {
  chordId: string;
  /** inversion index: 0 root, 1 first, 2 second (only > 0 on inversion levels) */
  inversion: number;
  /** the voiced midi notes, low → high */
  voiced: number[];
  /** bass note name without octave, e.g. "E" — used for slash labelling */
  bassName: string;
  /** the answer id, e.g. "maj" or "maj/E" */
  answerId: string;
}

export interface SpellingLevel {
  n: string;
  ch: string[];
  /** allowed inversions; [0] = root only */
  inv: number[];
}

export const SPELLING_LEVELS: SpellingLevel[] = [
  { n: 'Triads',      ch: ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'], inv: [0] },
  { n: '+ 7ths',      ch: ['maj7', 'min7', 'dom7', 'm7b5', 'dim7'],     inv: [0] },
  { n: '+ Inversions', ch: ['maj', 'min', 'maj7', 'min7', 'dom7'],      inv: [0, 1, 2] },
];

function pick<T>(list: readonly T[], recent: ReadonlyArray<T>): T {
  let avail = list.slice() as T[];
  if (avail.length > 3) {
    avail = avail.filter((s) => !recent.slice(-2).includes(s));
    if (avail.length === 0) avail = list.slice();
  }
  return avail[Math.floor(Math.random() * avail.length)];
}

/** Note name without octave, sharp-preferred (matches ND). */
function noteName(midi: number): string {
  return ND[((midi % 12) + 12) % 12];
}

/** Voice a chord in a given inversion, clamped to the soundfont range. */
function voiceInversion(rootMidi: number, intervals: number[], inv: number): number[] {
  const notes = intervals.map((iv) => rootMidi + iv);
  for (let i = 0; i < inv; i++) notes[i] += 12;
  let voiced = notes.slice().sort((a, b) => a - b);
  while (Math.max(...voiced) > SAMPLE_HI) voiced = voiced.map((n) => n - 12);
  while (Math.min(...voiced) < SAMPLE_LO) voiced = voiced.map((n) => n + 12);
  return voiced;
}

export const spellingExercise: Exercise<SpellingPayload> = {
  id: 'spelling',
  name: 'Name the Chord',
  levels: SPELLING_LEVELS,
  usesDirection: false,
  silentStart: true,

  generate({ levelIndex, keyOffset, recentPicks }) {
    const lv = SPELLING_LEVELS[levelIndex];
    const chId = pick(lv.ch, recentPicks as string[]);
    const ch = CHORDS.find((c) => c.id === chId)!;
    const inversion = pick(lv.inv, []) as number;

    let rm = 60 + keyOffset;
    const topOffset = Math.max(...ch.iv) + 12;
    while (rm + topOffset > SAMPLE_HI) rm -= 12;
    while (rm < SAMPLE_LO) rm += 12;

    const voiced = voiceInversion(rm, ch.iv, inversion);
    const bassName = noteName(voiced[0]);
    // Root position → just the chord name; inversion → slash chord (name/bass).
    const answerId = inversion === 0 ? chId : `${chId}/${bassName}`;

    // Spelling shown low → high, e.g. "E G C"
    const spelling = voiced.map(noteName).join('  ');

    return {
      root: rm,
      notes: voiced,
      payload: { chordId: chId, inversion, voiced, bassName, answerId },
      pickId: answerId,
      displayLabel: spelling,
    };
  },

  play(q, instId: InstrumentId, opts) {
    const humanize = opts?.humanize ?? false;
    const base = opts?.dynamics ?? -1;
    const vel = () =>
      base < 0
        ? 0.55 + Math.random() * 0.45
        : base * (humanize ? 0.85 + Math.random() * 0.15 : 1);
    const ordered = [...q.notes].sort((a, b) => a - b);
    // Arpeggiate then stack, so the spelling is audible note-by-note.
    const gap = 0.3;
    ordered.forEach((n, i) => pm(instId, n, i * gap, vel()));
    const chordAt = ordered.length * gap + 0.15;
    ordered.forEach((n) => pm(instId, n, chordAt, vel()));
  },

  answers(levelIndex): AnswerOption[] {
    const lv = SPELLING_LEVELS[levelIndex];
    const opts: AnswerOption[] = [];
    for (const chId of lv.ch) {
      const ch = CHORDS.find((c) => c.id === chId)!;
      if (lv.inv.length === 1 && lv.inv[0] === 0) {
        // Root-only level: one button per chord quality.
        opts.push({ id: chId, label: ch.n, short: ch.sh, color: ch.co });
      } else {
        // Inversion level: root + slash variants. We can't know the exact
        // bass note ahead of time per question, so we expose the quality
        // plus generic inversion tags; correctness matches on answerId.
        opts.push({ id: chId, label: `${ch.n} (root)`, short: ch.sh, color: ch.co });
      }
    }
    return opts;
  },

  /**
   * On inversion levels the precise slash answer depends on the question's
   * bass note, so we build the answer set per-question: the correct slash
   * chord plus a few plausible distractors.
   */
  getQuestionAnswers(q): AnswerOption[] {
    const lv = SPELLING_LEVELS.find((l) => l.ch.includes(q.payload.chordId))!;
    if (lv.inv.length === 1) {
      // root-only level — fall back to static answers
      return this.answers(SPELLING_LEVELS.indexOf(lv));
    }
    const ch = CHORDS.find((c) => c.id === q.payload.chordId)!;
    const opts: AnswerOption[] = [];
    // Correct answer
    opts.push({
      id: q.payload.answerId,
      label: q.payload.inversion === 0 ? ch.n : `${ch.n} / ${q.payload.bassName}`,
      short: q.payload.answerId,
      color: ch.co,
    });
    // Distractors: same chord in the other inversions, plus a different quality.
    for (const inv of lv.inv) {
      if (inv === q.payload.inversion) continue;
      const altNotes = voiceInversion(q.root, ch.iv, inv);
      const altBass = noteName(altNotes[0]);
      const altId = inv === 0 ? ch.id : `${ch.id}/${altBass}`;
      if (!opts.some((o) => o.id === altId)) {
        opts.push({
          id: altId,
          label: inv === 0 ? ch.n : `${ch.n} / ${altBass}`,
          short: altId,
          color: ch.co,
        });
      }
    }
    // One wrong-quality distractor for contrast.
    const other = lv.ch.find((c) => c !== ch.id);
    if (other) {
      const oc = CHORDS.find((c) => c.id === other)!;
      opts.push({ id: oc.id, label: oc.n, short: oc.sh, color: oc.co });
    }
    // Shuffle
    return opts.sort(() => Math.random() - 0.5);
  },

  isCorrect(q, guess) {
    return guess === q.payload.answerId;
  },

  feedback(answerId) {
    const idStr = String(answerId);
    const [base, bass] = idStr.split('/');
    const ch = CHORDS.find((c) => c.id === base);
    const label = ch ? (bass ? `${ch.n} / ${bass}` : ch.n) : idStr;
    return {
      label,
      color: ch?.co ?? '#a78bfa',
      // Auto-play on reveal: arpeggiate the chord from C4 reference.
      demoPlay: (instId: InstrumentId) => {
        if (!ch) return;
        const voiced = voiceInversion(60, ch.iv, 0);
        const gap = 0.28;
        voiced.forEach((n, i) => pm(instId, n, i * gap));
        voiced.forEach((n) => pm(instId, n, voiced.length * gap + 0.12));
      },
    };
  },
};
