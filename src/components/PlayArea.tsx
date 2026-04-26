import { useState } from 'react';
import { m2d } from '../audio/theory';
import type { FeedbackInfo } from '../exercises/types';

interface PlayAreaProps {
  hasQuestion: boolean;
  rootMidi: number | null;
  feedback: { ok: boolean } | null;
  correctLabel: string | null;
  feedbackInfo: FeedbackInfo | null;
  onStart: () => void;
  onReplay: () => void;
  onNext: () => void;
}

export function PlayArea({
  hasQuestion,
  rootMidi,
  feedback,
  correctLabel,
  feedbackInfo,
  onStart,
  onReplay,
  onNext,
}: PlayAreaProps) {
  const [showRef, setShowRef] = useState(false);

  if (!hasQuestion) {
    return (
      <>
        <div className="play-area">
          <button className="big-btn" onClick={onStart}>▶ Start Training</button>
        </div>
        <div className="ag" />
      </>
    );
  }

  return (
    <>
      <div className="play-area">
        {feedback && correctLabel && (
          <div className={`fb ${feedback.ok ? 'ok' : 'no'}`}>
            <span style={{ fontSize: '18px', marginRight: '5px' }}>
              {feedback.ok ? '✓' : '✗'}
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: feedback.ok ? '#22c55e' : '#ef4444',
            }}>
              {feedback.ok ? 'Correct!' : `It was ${correctLabel}`}
            </span>
          </div>
        )}

        {rootMidi !== null && (
          <div className="root-label">Root: {m2d(rootMidi)}</div>
        )}

        <div className="arow">
          <button className="abtn rpb" onClick={onReplay}>🔈 Replay</button>
          {feedback && <button className="abtn nxb" onClick={onNext}>Next →</button>}
        </div>
      </div>

      {feedback && feedbackInfo && feedbackInfo.reference && (
        <div className="rref">
          <button className="rrbtn" onClick={() => setShowRef((v) => !v)}>
            💡 {showRef ? 'Hide' : 'Show'} Reference
          </button>
          {showRef && (
            <div className="rrinfo">
              <div style={{ fontSize: '14px', fontWeight: 700, color: feedbackInfo.color }}>
                {feedbackInfo.label}
              </div>
              <div style={{ fontSize: '12px', color: '#ccc', marginTop: '2px' }}>
                {feedbackInfo.reference}
              </div>
              {feedbackInfo.altReference && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '1px' }}>
                  {feedbackInfo.altReference}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
