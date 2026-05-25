/**
 * ProgressionAnswerBuilder — slot-based answer UI for the Progressions exercise.
 *
 * Renders N slot boxes for an N-chord progression, plus the standard chord
 * answer grid. Tapping a chord button fills the active slot and advances
 * the cursor. Tapping a filled slot rewinds back to it for correction.
 * Once all slots are filled the parent's onSubmit is called with the
 * comma-joined sequence.
 *
 * After submission (locked = true), each slot shows the user's guess and
 * (if wrong) the correct value beneath it.
 */

import { useState, useEffect } from 'react';
import type { AnswerOption } from '../exercises/types';

interface ProgressionAnswerBuilderProps {
  /** Chord choices for this level. */
  answers: AnswerOption[];
  /** Number of slots in the current progression. */
  slotCount: number;
  /** Once the user's full guess is in (or after submit), this becomes the
   *  comma-joined string. Null otherwise. */
  guessedString: string | null;
  /** The correct sequence (comma-joined) — only set once locked. */
  correctString: string | null;
  /** Disables interaction (after answer revealed). */
  locked: boolean;
  /** Currently active chord index — set by playback animation pre-answer,
   *  or by review clicks post-answer. Null when nothing is highlighted. */
  activeChordIdx: number | null;
  /** Called when all slots are filled — value is the comma-joined sequence. */
  onSubmit: (joined: string) => void;
  /** Called when the user taps a slot post-answer to review that chord. */
  onReviewSlot?: (idx: number) => void;
  /** Called when user picks a chord (pre-answer) — plays that chord so the user hears what they selected. */
  onPlayChord?: (chordId: string) => void;
}

export function ProgressionAnswerBuilder({
  answers,
  slotCount,
  guessedString,
  correctString,
  locked,
  activeChordIdx,
  onSubmit,
  onReviewSlot,
  onPlayChord,
}: ProgressionAnswerBuilderProps) {
  // Local in-progress slot fill state. Reset whenever slotCount changes
  // (i.e. when a new question begins).
  const [slots, setSlots] = useState<(string | null)[]>(
    () => Array(slotCount).fill(null),
  );
  const [cursor, setCursor] = useState(0);

  // Reset on new question
  useEffect(() => {
    setSlots(Array(slotCount).fill(null));
    setCursor(0);
  }, [slotCount, guessedString === null]);

  // After a submitted answer, show user's actual guess in the slots
  const guessSlots = guessedString ? guessedString.split(',') : null;
  const correctSlots = correctString ? correctString.split(',') : null;

  const displaySlots: (string | null)[] = locked && guessSlots
    ? guessSlots
    : slots;

  const handleChordPick = (id: string | number) => {
    if (locked) return;
    if (cursor >= slotCount) return;

    // Play the chord so the user hears what they selected
    onPlayChord?.(String(id));

    const newSlots = [...slots];
    newSlots[cursor] = String(id);

    // Advance to next empty slot (or wrap)
    let nextCursor = cursor + 1;
    while (nextCursor < slotCount && newSlots[nextCursor] !== null) nextCursor++;

    setSlots(newSlots);
    setCursor(nextCursor);

    // If all slots are now filled, submit immediately
    if (newSlots.every((s) => s !== null)) {
      onSubmit(newSlots.join(','));
    }
  };

  const handleSlotTap = (idx: number) => {
    if (locked) {
      // Review mode: re-hear this chord
      onReviewSlot?.(idx);
      return;
    }
    // Entry mode: move cursor AND replay the exercise's chord at this position
    setCursor(idx);
    onReviewSlot?.(idx);
  };

  const handleClear = () => {
    if (locked) return;
    setSlots(Array(slotCount).fill(null));
    setCursor(0);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="prog-answer">
      {/* Slot bar */}
      <div className="prog-slots">
        {displaySlots.map((val, i) => {
          const isCursor = !locked && i === cursor;
          const isPlaying = activeChordIdx === i;
          const userGuess = guessSlots?.[i] ?? null;
          const correctVal = correctSlots?.[i] ?? null;
          const isWrong = locked && userGuess !== null && correctVal !== null && userGuess !== correctVal;
          const isRight = locked && userGuess !== null && correctVal !== null && userGuess === correctVal;

          const chord = val ? answers.find((a) => a.id === val) : null;
          const correctChord = correctVal ? answers.find((a) => a.id === correctVal) : null;

          let cls = 'prog-slot';
          if (isCursor) cls += ' active';
          if (isPlaying) cls += ' playing';
          if (isRight) cls += ' co';
          if (isWrong) cls += ' wr';

          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleSlotTap(i)}
              style={chord ? { '--ac': chord.color } as React.CSSProperties : undefined}
              title={locked ? 'Tap to re-hear this chord' : undefined}
            >
              <span className="prog-slot-idx">{i + 1}</span>
              <span className="prog-slot-val">{chord?.short ?? '—'}</span>
              {isWrong && correctChord && (
                <span className="prog-slot-correct">
                  was {correctChord.short}
                </span>
              )}
            </button>
          );
        })}

        {/* Clear button — only visible during entry, when at least one slot is filled */}
        {!locked && slots.some((s) => s !== null) && (
          <button className="prog-clear" onClick={handleClear} aria-label="Clear">
            ⟲
          </button>
        )}
      </div>

      {locked && (
        <div className="prog-review-hint">
          Tap any slot above to re-hear that chord on its own
        </div>
      )}

      {/* Chord answer grid — grouped by function family */}
      {!locked && <GroupedChordGrid answers={answers} onPick={handleChordPick} />}
      {locked && (
        <div className="ag" style={{ opacity: 0.3 }}>
          {answers.map((a) => (
            <button key={String(a.id)} className="ab dm" style={{ '--ac': a.color } as React.CSSProperties} disabled>
              <span className="sh">{a.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Grouped answer grid ──────────────────────────────────────────────────────
// Groups chords by function family (tonic / subdominant / dominant / nondiatonic)
// so the user isn't staring at 14+ flat buttons.

const FAMILY_META: Record<string, { label: string; color: string }> = {
  tonic:       { label: 'Tonic',       color: '#22c55e' },
  subdominant: { label: 'Subdominant', color: '#3b82f6' },
  dominant:    { label: 'Dominant',    color: '#f43f5e' },
  nondiatonic: { label: 'Non-diatonic',color: '#f97316' },
};

const FAMILY_ORDER = ['tonic', 'subdominant', 'dominant', 'nondiatonic'];

function GroupedChordGrid({
  answers,
  onPick,
}: {
  answers: AnswerOption[];
  onPick: (id: string | number) => void;
}) {
  const groups: Record<string, AnswerOption[]> = {};
  for (const a of answers) {
    const fn = (a.hint as string) ?? 'tonic';
    if (!groups[fn]) groups[fn] = [];
    groups[fn].push(a);
  }

  const families = FAMILY_ORDER.filter((f) => groups[f]?.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '4px 0' }}>
      {families.map((fn) => {
        const meta = FAMILY_META[fn] ?? { label: fn, color: '#888' };
        return (
          <div key={fn}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: meta.color,
              textTransform: 'uppercase', letterSpacing: 1.2,
              marginBottom: 4, opacity: 0.7,
            }}>
              {meta.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {groups[fn].map((a) => (
                <button
                  key={String(a.id)}
                  className="ab"
                  style={{
                    '--ac': a.color,
                    flex: '0 0 auto',
                    minWidth: 52,
                    padding: '7px 10px',
                  } as React.CSSProperties}
                  onClick={() => onPick(a.id)}
                >
                  <span className="sh">{a.short}</span>
                  {a.label !== a.short ? a.label : null}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

}
