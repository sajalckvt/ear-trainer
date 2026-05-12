/**
 * Chord identification exercise.
 *
 * Covers triads, 7th chords, and 9th-chord tensions across 5 levels:
 *   Beginner: maj / min
 *   Easy:     + dim, sus4
 *   Medium:   + aug, sus2, dom7
 *   Hard:     + maj7, min7  (the three core 7ths — your first decision
 *             after major-or-minor)
 *   Expert:   focus on 4- and 5-note jazz colours — maj7, min7, dom7,
 *             m7♭5, dim7, mMaj7, dom7♭9, dom7♯9
 *
 * Spread voicing: when `opts.spread === true`, each chord tone gets a
 * random 0/1/2-octave bump (range-clamped to the soundfont). This forces
 * the user to recognize the chord *quality* rather than memorize its
 * close-position shape.
 *
 * Internal id remains 'triad' to preserve any persisted user state from
 * the previous "Triads" exercise; the display name is now "Chords".
 */

import { CHORDS, CH_LEVELS, SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import { pm, playPhrase, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption, SongRefPlayable } from './types';

interface ChordPayload { chordId: string; }

function pick<T>(list: readonly T[], recent: ReadonlyArray<T>): T {
  let avail = list.slice() as T[];
  if (avail.length > 3) {
    avail = avail.filter((s) => !recent.slice(-2).includes(s));
    if (avail.length === 0) avail = list.slice();
  }
  return avail[Math.floor(Math.random() * avail.length)];
}

// Pairs that are "close" — share most notes / same family.
// Used to trigger the close-miss retry instead of marking as a full wrong.
const CLOSE_PAIRS = new Set([
  // triad↔7th of the same root
  'maj_maj7', 'maj7_maj',
  'min_min7', 'min7_min',
  // sus pairs
  'sus2_sus4', 'sus4_sus2',
  // 4-note 7th family confusions
  'dom7_maj7', 'maj7_dom7',
  'dom7_min7', 'min7_dom7',
  'min7_m7b5', 'm7b5_min7',
  'm7b5_dim7', 'dim7_m7b5',
  'min7_mMaj7', 'mMaj7_min7',
  'min_mMaj7', 'mMaj7_min',
  // 5-note tension confusions (dom7 family)
  'dom7_dom7b9', 'dom7b9_dom7',
  'dom7_dom7sharp9', 'dom7sharp9_dom7',
  'dom7b9_dom7sharp9', 'dom7sharp9_dom7b9',
  // triad↔dim7 (3-note dim is one note shy of dim7)
  'dim_dim7', 'dim7_dim',
  'dim_m7b5', 'm7b5_dim',
]);

const CHORD_HINTS: Record<string, string> = {
  'maj_maj7':           'So close! You heard the major quality. Listen for a fourth note adding a dreamy colour on top.',
  'maj7_maj':           'Very close! You heard the extra colour. Without it, the chord feels simpler and more resolved.',
  'min_min7':           'Almost! You heard the minor darkness. There\'s a subtle extra note making it silkier.',
  'min7_min':           'Close! You heard the silky quality. Without the extra note it\'s starker and more direct.',
  'sus2_sus4':          'So close! Both feel suspended and open. Does it lean backward (2nd) or forward (4th)?',
  'sus4_sus2':          'So close! Both are suspended. Does it push forward, or float openly?',
  'dom7_maj7':          'Close! You heard the 4-note quality. The top note is bluesy (♭7) vs. dreamy (M7).',
  'maj7_dom7':          'Close! Same richness — is that top note dreamy (M7) or bluesy (♭7)?',
  'dom7_min7':          'Close! Both are smoky 7ths. Bright major foundation, or dark minor?',
  'min7_dom7':          'Close! Both have ♭7 warmth. Foundation bright (major) or dark (minor)?',
  'min7_m7b5':          'Close! Both are dark and silky. The 5th is lowered, adding tension underneath.',
  'm7b5_min7':          'Close! Same minor-ish silk. The 5th is natural, not flatted — less tense underneath.',
  'm7b5_dim7':          'Close! Both feel unstable. dim7 lowers the ♭7 to a ♭♭7 — fully symmetrical.',
  'dim7_m7b5':          'Close! Both are dark, dissonant. The top note is a ♭7, not a ♭♭7 — slightly less tense.',
  'min_mMaj7':          'Close! Same minor body. There\'s a leading-tone (M7) on top adding cinematic tension.',
  'mMaj7_min':          'Close! Minor body — but without the M7 halo, it\'s just plain minor.',
  'min7_mMaj7':         'Close! Same minor body. Top note is bright (M7) instead of bluesy (♭7).',
  'mMaj7_min7':         'Close! Same minor body. Top note is bluesy (♭7) instead of bright (M7).',
  'dom7_dom7b9':        'Close! Both are bluesy dom7s. There\'s an extra ♭9 on top — most dissonant tension.',
  'dom7b9_dom7':        'Close! Same bluesy core. Without the ♭9, the tension is gone — just the dom7.',
  'dom7_dom7sharp9':    'Close! Both are bluesy dom7s. There\'s a ♯9 on top — the "Hendrix" major+minor stack.',
  'dom7sharp9_dom7':    'Close! Same bluesy core. Without the ♯9, the major/minor ambiguity is gone.',
  'dom7b9_dom7sharp9':  'Close! Both have dom7 + a 9 tension. Is the 9 flatted (Jaws) or sharped (Hendrix)?',
  'dom7sharp9_dom7b9':  'Close! Both add a tense 9 to dom7. Flatted (most dissonant) or sharped (Hendrix bite)?',
  'dim_dim7':           'Close! You heard the dim triad. There\'s a fourth note on top — another m3 stack.',
  'dim7_dim':           'Close! Same dim foundation. Without the top ♭♭7, it\'s a 3-note dim triad.',
  'dim_m7b5':           'Close! You heard dim foundation. The top note here is a ♭7, making it half-dim.',
  'm7b5_dim':           'Close! Same dim-leaning core. Without the top ♭7, it\'s just the dim triad.',
};

// Stacked-chord demo from C4 — arpeggiated then together
function makeChordDemo(intervals: number[]) {
  return (instId: InstrumentId) => {
    intervals.forEach((i, idx) => pm(instId, 60 + i, idx * 0.22));
    const t = intervals.length * 0.22 + 0.1;
    intervals.forEach((i) => pm(instId, 60 + i, t));
  };
}

/**
 * Apply spread voicing: each chord tone (except the root) gets a random
 * 0/1/2-octave upward bump. The root stays at `rm` to anchor the bass.
 *
 * Notes are clamped to the soundfont range (SAMPLE_LO..SAMPLE_HI = 57..79).
 * If a bumped note exceeds SAMPLE_HI, we drop it back by an octave at a time.
 *
 * The result is a wide, "real piano voicing" shape that defeats shape-memory
 * and forces quality-based recognition.
 */
function applySpread(rootMidi: number, intervals: number[]): number[] {
  return intervals.map((iv, idx) => {
    if (idx === 0) return rootMidi; // anchor root
    const bump = Math.floor(Math.random() * 3) * 12; // 0, 12, or 24 semitones
    let n = rootMidi + iv + bump;
    while (n > SAMPLE_HI) n -= 12;
    while (n < SAMPLE_LO) n += 12;
    return n;
  });
}

export const triadExercise: Exercise<ChordPayload> = {
  id: 'triad',
  name: 'Chords',
  levels: CH_LEVELS,
  usesDirection: false,

  generate({ levelIndex, keyOffset, recentPicks, spread }) {
    const lv = CH_LEVELS[levelIndex];
    const chId = pick(lv.ch, recentPicks as string[]);
    const ch = CHORDS.find((c) => c.id === chId)!;

    let rm = 60 + keyOffset;
    const topOffset = Math.max(...ch.iv);
    while (rm + topOffset > SAMPLE_HI) rm -= 12;
    while (rm < SAMPLE_LO) rm += 12;

    const notes = spread
      ? applySpread(rm, ch.iv)
      : ch.iv.map((i) => rm + i);

    return { root: rm, notes, payload: { chordId: chId }, pickId: chId };
  },

  play(q, instId: InstrumentId) {
    const gap = 0.3;
    // Play in ascending order so spread voicings still arpeggiate low-to-high
    const ordered = [...q.notes].sort((a, b) => a - b);
    ordered.forEach((n, i) => pm(instId, n, i * gap));
    const chordAt = ordered.length * gap + 0.15;
    ordered.forEach((n) => pm(instId, n, chordAt));
  },

  answers(levelIndex): AnswerOption[] {
    return CH_LEVELS[levelIndex].ch.map((chId) => {
      const ch = CHORDS.find((c) => c.id === chId)!;
      return { id: ch.id, label: ch.n, short: ch.sh, color: ch.co, hint: ch.fmd };
    });
  },

  isCorrect(q, guess) { return guess === q.payload.chordId; },

  isClose(q, guess) {
    return CLOSE_PAIRS.has(`${q.payload.chordId}_${guess}`);
  },

  getHint(correctId, guessId) {
    const key = `${guessId}_${correctId}`;
    return CHORD_HINTS[key] ?? 'You\'re close! Listen again to the character of the chord.';
  },

  feedback(answerId) {
    const ch = CHORDS.find((c) => c.id === (answerId as string))!;
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
      // Generic stacked-chord demo from C4 — works for any chord
      demoPlay: makeChordDemo(ch.iv),
    };
  },
};
