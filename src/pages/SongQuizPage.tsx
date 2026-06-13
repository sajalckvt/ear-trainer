/**
 * SongQuizPage — "name the progression from the real recording".
 *
 * Plays a clip of the actual track (via YouTubeClip) and asks the user to fill
 * the chord slots from a diatonic palette. The key is told up-front; any
 * non-diatonic chord is given (pre-filled) per the current level's rules.
 *
 * This is the single-hardcoded proof-of-loop. The data model already supports
 * many exercises per track and many tracks (data/songQuizzes.ts); the UI here
 * just drives the first exercise while we iterate on the input design.
 */

import { useState, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { YouTubeClip } from '../components/YouTubeClip';
import { ALL_SONG_EXERCISES } from '../data/songQuizzes';
import { PROGRESSION_CHORD_MAP } from '../data/progressions';
import { SAMPLE_LO, SAMPLE_HI } from '../data/constants';
import { keyToOffset } from '../audio/theory';
import { pm, type InstrumentId } from '../audio/engine';

// Diatonic major-key triads — the answer palette for the current level.
const DIATONIC_TRIADS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

function voiceChord(chordRoot: number, intervals: number[]): number[] {
  let rm = chordRoot;
  const top = Math.max(...intervals);
  while (rm + top > SAMPLE_HI + 2) rm -= 12;
  while (rm < SAMPLE_LO) rm += 12;
  return intervals.map((i) => rm + i);
}

interface SongQuizPageProps {
  visible: boolean;
  instrument: InstrumentId;
}

export function SongQuizPage({ visible, instrument }: SongQuizPageProps) {
  // Single hardcoded exercise for now (the proof-of-loop).
  const { track, ex } = ALL_SONG_EXERCISES[0];

  // Tonic MIDI for chord previews, clamped into the sampler's range.
  let keyRoot = 60 + keyToOffset(ex.key);
  while (keyRoot + 17 > SAMPLE_HI) keyRoot -= 12;
  while (keyRoot < SAMPLE_LO) keyRoot += 12;

  const playChordId = useCallback((chordId: string) => {
    const ch = PROGRESSION_CHORD_MAP[chordId];
    if (!ch) return;
    voiceChord(keyRoot + ch.rootOffset, ch.iv).forEach((n) => pm(instrument, n, 0));
  }, [keyRoot, instrument]);

  // Slot fill state: given slots are fixed, others start empty.
  const initialFill = useCallback(
    () => ex.slots.map((s) => (s.given ? s.chord : null)),
    [ex],
  );
  const [fill, setFill] = useState<(string | null)[]>(initialFill);
  const [locked, setLocked] = useState(false);

  useEffect(() => { setFill(initialFill()); setLocked(false); }, [initialFill]);

  const firstEmpty = (arr: (string | null)[]) => arr.findIndex((v) => v === null);
  const cursor = firstEmpty(fill);

  const pick = (chordId: string) => {
    if (locked) return;
    playChordId(chordId);
    const idx = firstEmpty(fill);
    if (idx === -1) return;
    const next = [...fill];
    next[idx] = chordId;
    setFill(next);
    if (firstEmpty(next) === -1) setLocked(true); // all slots filled → grade
  };

  const reset = () => { setFill(initialFill()); setLocked(false); };

  const answer = ex.slots.map((s) => s.chord);
  const allCorrect = locked && fill.every((v, i) => v === answer[i]);
  const palette = DIATONIC_TRIADS.map((id) => PROGRESSION_CHORD_MAP[id]).filter(Boolean);

  return (
    <div className={`screen${visible ? ' vis' : ''}`}>
      <div className="sq-head">
        <div className="sq-title">{track.artist} — {track.title}</div>
        <div className="sq-section">{ex.section}</div>
      </div>

      <YouTubeClip videoId={track.videoId} start={ex.start} end={ex.end} loop />

      <div className="sq-keybar">
        <span className="sq-key">Key: {ex.key} major</span>
        {ex.keyNote && <span className="sq-keynote">{ex.keyNote}</span>}
      </div>

      {/* Chord slots */}
      <div className="prog-slots">
        {ex.slots.map((slot, i) => {
          const val = fill[i];
          const ch = val ? PROGRESSION_CHORD_MAP[val] : null;
          const correct = answer[i];
          const isWrong = locked && val !== correct;
          const isRight = locked && val === correct;
          let cls = 'prog-slot';
          if (!locked && i === cursor) cls += ' active';
          if (slot.given) cls += ' given';
          if (isRight) cls += ' co';
          if (isWrong) cls += ' wr';
          return (
            <div key={i} className={cls} style={ch ? ({ '--ac': ch.co } as CSSProperties) : undefined}>
              <span className="prog-slot-idx">{slot.given ? 'given' : i + 1}</span>
              <span className="prog-slot-val">{ch?.sh ?? '—'}</span>
              {isWrong && (
                <span className="prog-slot-correct">was {PROGRESSION_CHORD_MAP[correct]?.sh}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Diatonic palette */}
      {!locked && (
        <div className="ag">
          {palette.map((ch) => (
            <button
              key={ch.id}
              className="ab"
              style={{ '--ac': ch.co } as CSSProperties}
              onClick={() => pick(ch.id)}
            >
              <span className="sh">{ch.sh}</span>
            </button>
          ))}
        </div>
      )}

      {/* Result */}
      {locked && (
        <div className="sq-result">
          <div className={allCorrect ? 'sq-verdict ok' : 'sq-verdict no'}>
            {allCorrect ? '✓ Correct!' : '✗ Not quite'}
          </div>
          <div className="sq-answer">
            Answer: {answer.map((id) => PROGRESSION_CHORD_MAP[id]?.sh ?? id).join('  →  ')}
          </div>
          <button className="yt-btn" onClick={reset}>Try again</button>
        </div>
      )}

      <div className="sq-hint">
        Tap a chord to hear it in {ex.key} and fill the next slot. The ♭VII is given.
      </div>
    </div>
  );
}
