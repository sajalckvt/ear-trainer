import { CHORDS, CH_LEVELS, SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import { pm, type InstrumentId } from '../audio/engine';
import type { Exercise, AnswerOption } from './types';

interface TriadPayload { chordId: string; }

function pick<T>(list: readonly T[], recent: ReadonlyArray<T>): T {
  let avail = list.slice() as T[];
  if (avail.length > 3) {
    avail = avail.filter((s) => !recent.slice(-2).includes(s));
    if (avail.length === 0) avail = list.slice();
  }
  return avail[Math.floor(Math.random() * avail.length)];
}

// Pairs that are "close" — share most notes / same family
const CLOSE_PAIRS = new Set([
  'maj_maj7', 'maj7_maj',
  'min_min7', 'min7_min',
  'sus2_sus4', 'sus4_sus2',
  'dom7_maj7', 'maj7_dom7',
  'dom7_min7', 'min7_dom7',
]);

const CHORD_HINTS: Record<string, string> = {
  'maj_maj7': 'So close! You heard the major quality. Listen for a fourth note that adds a dreamy colour on top.',
  'maj7_maj': 'Very close! You heard the extra colour. Without it, the chord feels simpler and more resolved.',
  'min_min7': 'Almost! You heard the minor darkness. There\'s a subtle extra note making it silkier.',
  'min7_min': 'Close! You heard the silky quality. Without the extra note it\'s starker and more direct.',
  'sus2_sus4': 'So close! Both feel suspended and open. Does it lean backward (2nd) or forward (4th)?',
  'sus4_sus2': 'So close! Both are suspended. Does it have more tension pushing forward, or floating openness?',
  'dom7_maj7': 'Close! You heard the 4-note quality. The difference is in the colour of that top note — bluesy vs. dreamy.',
  'maj7_dom7': 'Close! You heard the richness. Is that top note dreamy and resolved, or bluesy and restless?',
  'dom7_min7': 'Close! Both are smoky 7th chords. Is the base chord major (bright) or minor (dark)?',
  'min7_dom7': 'Close! Both have that 7th warmth. Is the foundation bright and bluesy, or dark and soulful?',
};

// Demo patterns: canonical chord played from C4, arpeggiated then together
function makeChordDemo(intervals: number[]) {
  return (instId: InstrumentId) => {
    intervals.forEach((i, idx) => pm(instId, 60 + i, idx * 0.22));
    const t = intervals.length * 0.22 + 0.1;
    intervals.forEach((i) => pm(instId, 60 + i, t));
  };
}

// Special demos for chords that tell a story
const CHORD_DEMOS: Record<string, (instId: InstrumentId) => void> = {
  maj:  makeChordDemo([0, 4, 7]),
  min:  (inst) => { [0,3,7].forEach((n,i) => pm(inst, 60+n, i*0.3)); },  // slower, sadder
  dim:  (inst) => { [0,3,6].forEach((n,i) => pm(inst, 60+n, i*0.25)); }, // tense, no resolve
  aug:  (inst) => { pm(inst,60,0); pm(inst,64,0.3); pm(inst,68,0.6); pm(inst,68,1.1); }, // hold the unsettling note
  sus2: (inst) => { [0,2,7].forEach((n,i) => pm(inst,60+n,i*0.25)); setTimeout(()=>[0,4,7].forEach(n=>pm(inst,60+n,0)),1000); },
  sus4: (inst) => { [0,5,7].forEach((n,i) => pm(inst,60+n,i*0.25)); setTimeout(()=>[0,4,7].forEach(n=>pm(inst,60+n,0)),900); },
  maj7: makeChordDemo([0, 4, 7, 11]),
  min7: makeChordDemo([0, 3, 7, 10]),
  dom7: (inst) => { makeChordDemo([0,4,7,10])(inst); }, // bluesy feel, let the b7 ring
};

export const triadExercise: Exercise<TriadPayload> = {
  id: 'triad',
  name: 'Phase 2: Triads',
  levels: CH_LEVELS,
  usesDirection: false,

  generate({ levelIndex, keyOffset, recentPicks }) {
    const lv = CH_LEVELS[levelIndex];
    const chId = pick(lv.ch, recentPicks as string[]);
    const ch = CHORDS.find((c) => c.id === chId)!;

    let rm = 60 + keyOffset;
    const topOffset = Math.max(...ch.iv);
    while (rm + topOffset > SAMPLE_HI) rm -= 12;
    while (rm < SAMPLE_LO) rm += 12;

    const notes = ch.iv.map((i) => rm + i);
    return { root: rm, notes, payload: { chordId: chId }, pickId: chId };
  },

  play(q, instId: InstrumentId) {
    const gap = 0.3;
    q.notes.forEach((n, i) => pm(instId, n, i * gap));
    const chordAt = q.notes.length * gap + 0.15;
    q.notes.forEach((n) => pm(instId, n, chordAt));
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
    return {
      label: ch.n,
      color: ch.co,
      reference: ch.song,
      altReference: ch.songAlt,
      demoPlay: CHORD_DEMOS[ch.id],
    };
  },
};
