import { useEffect, useRef } from 'react';
import type { FeedbackInfo } from '../exercises/types';
import type { QuizPhase } from '../hooks/useQuizState';
import type { InstrumentId } from '../audio/engine';

interface FeedbackSheetProps {
  quizPhase: QuizPhase;
  /** Info about the CORRECT answer (always) */
  correctInfo: FeedbackInfo | null;
  /** Hint text when in close_miss phase */
  hint: string | null;
  instrument: InstrumentId;
  /** Root MIDI of the current question — used to transpose song-ref phrases */
  questionRoot: number;
  onNext: () => void;
  onDismiss: () => void;
}

export function FeedbackSheet({
  quizPhase,
  correctInfo,
  hint,
  instrument,
  questionRoot,
  onNext,
  onDismiss,
}: FeedbackSheetProps) {
  const open = quizPhase === 'close_miss' || quizPhase === 'answered';
  const hasPlayed = useRef(false);

  // Auto-play demo when sheet opens on 'answered' (not on close_miss — don't reveal)
  useEffect(() => {
    if (quizPhase === 'answered' && correctInfo?.demoPlay && !hasPlayed.current) {
      hasPlayed.current = true;
      // Small delay so the sheet animation finishes first
      const t = setTimeout(() => correctInfo.demoPlay!(instrument), 350);
      return () => clearTimeout(t);
    }
    if (!open) hasPlayed.current = false;
  }, [quizPhase, correctInfo, instrument, open]);

  if (!open || !correctInfo) return null;

  const isCloseMiss = quizPhase === 'close_miss';

  return (
    <>
      {/* Invisible backdrop — tapping outside dismisses the sheet */}
      <div
        className="fs-backdrop"
        onClick={onDismiss}
        aria-hidden="true"
      />
      <div className={`fs${open ? ' open' : ''}`} role="dialog" aria-modal="false">
        {/* Drag handle */}
        <div className="fs-handle" />

        <button className="fs-x" onClick={onDismiss} aria-label="Dismiss">✕</button>

        {isCloseMiss ? (
          /* ── Close miss: hint only, no answer revealed ── */
          <div className="fs-body">
            <div className="fs-icon">👂</div>
            <div className="fs-title" style={{ color: '#f59e0b' }}>So close!</div>
            <div className="fs-hint">{hint}</div>
            <div className="fs-sub">Try again ↑</div>
          </div>
        ) : (
          /* ── Final answer: full feedback ── */
          <div className="fs-body">
            <div className="fs-name" style={{ color: correctInfo.color }}>
              {correctInfo.label}
            </div>

            {/* New schema: playable song references */}
            {correctInfo.songRefs && correctInfo.songRefs.length > 0 && (
              <div className="fs-songs">
                {correctInfo.songRefs.map((s, i) => (
                  <div key={i} className="fs-song">
                    {s.play ? (
                      <button
                        className="fs-song-play"
                        onClick={() => s.play!(instrument, questionRoot)}
                        aria-label={`Play hook from ${s.title}`}
                      >
                        ▶
                      </button>
                    ) : (
                      <span className="fs-song-play disabled" aria-hidden="true">🎵</span>
                    )}
                    <div className="fs-song-text">
                      <div className="fs-song-title">{s.title}</div>
                      {s.hint && <div className="fs-song-hint">{s.hint}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Legacy schema fallback — older exercises haven't migrated yet */}
            {!correctInfo.songRefs && correctInfo.reference && (
              <div className="fs-ref">
                <span className="fs-ref-icon">🎵</span>
                <span>{correctInfo.reference}</span>
              </div>
            )}
            {!correctInfo.songRefs && correctInfo.altReference && (
              <div className="fs-ref alt">
                <span className="fs-ref-icon">🎵</span>
                <span>{correctInfo.altReference}</span>
              </div>
            )}

            <div className="fs-actions">
              {correctInfo.demoPlay && (
                <button
                  className="fs-btn demo"
                  onClick={() => correctInfo.demoPlay!(instrument)}
                >
                  🔈 Hear example
                </button>
              )}
              <button className="fs-btn next" onClick={onNext}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
