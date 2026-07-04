/**
 * Ruler — the click-to-answer strip used by Pan Position (linear pan) and
 * EQ Boost (log frequency). Hover shows a live readout; click locks
 * the answer. During reveal it renders "yours" vs "correct" markers.
 */

import { useRef, useState, type PointerEvent } from 'react';

export interface RulerTick {
  pos: number;   // 0..1
  label: string;
}

export function Ruler({
  ticks,
  format,
  onAnswer,
  reveal,
  disabled,
}: {
  ticks: RulerTick[];
  /** Format the readout for a 0..1 position (e.g. pos→"432 Hz" or "0.35 L"). */
  format: (pos: number) => string;
  onAnswer: (pos: number) => void;
  /** When set, shows the answer markers instead of accepting input. */
  reveal?: { yours: number; correct: number } | null;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const posFromEvent = (e: PointerEvent): number => {
    const rect = ref.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  };

  const interactive = !reveal && !disabled;

  return (
    <div
      ref={ref}
      className={`studio-ruler${interactive ? ' interactive' : ''}`}
      onPointerMove={interactive ? (e) => setHover(posFromEvent(e)) : undefined}
      onPointerLeave={interactive ? () => setHover(null) : undefined}
      onPointerDown={interactive ? (e) => onAnswer(posFromEvent(e)) : undefined}
    >
      {ticks.map((t) => (
        <div key={t.pos} className="studio-ruler-tick" style={{ left: `${t.pos * 100}%` }}>
          <div className="studio-ruler-tickline" />
          <div className="studio-ruler-ticklabel">{t.label}</div>
        </div>
      ))}

      {interactive && hover !== null && (
        <div className="studio-ruler-cursor" style={{ left: `${hover * 100}%` }}>
          <div className="studio-ruler-cursorline" />
          <div className="studio-ruler-readout">{format(hover)}</div>
        </div>
      )}

      {reveal && (
        <>
          <div className="studio-ruler-marker yours" style={{ left: `${reveal.yours * 100}%` }}>
            <div className="studio-ruler-cursorline" />
            <div className="studio-ruler-readout">{format(reveal.yours)}</div>
          </div>
          <div className="studio-ruler-marker correct" style={{ left: `${reveal.correct * 100}%` }}>
            <div className="studio-ruler-cursorline" />
            <div className="studio-ruler-readout">{format(reveal.correct)}</div>
          </div>
        </>
      )}
    </div>
  );
}
