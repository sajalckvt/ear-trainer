/**
 * Plane2D — 2-axis click-to-answer plane for Pan + Frequency:
 * x = pan (−1 … 1), y = frequency (log, high at top). Crosshair with live
 * readout while hunting; yours-vs-correct dots on reveal.
 */

import { useRef, useState, type PointerEvent } from 'react';

export interface PlanePoint {
  x: number; // 0..1
  y: number; // 0..1 (0 = top)
}

export function Plane2D({
  format,
  onAnswer,
  reveal,
  xTicks,
  yTicks,
}: {
  format: (p: PlanePoint) => string;
  onAnswer: (p: PlanePoint) => void;
  reveal?: { yours: PlanePoint; correct: PlanePoint } | null;
  xTicks: { pos: number; label: string }[];
  yTicks: { pos: number; label: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<PlanePoint | null>(null);

  const fromEvent = (e: PointerEvent): PlanePoint => {
    const r = ref.current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  const interactive = !reveal;

  return (
    <div
      ref={ref}
      className={`studio-plane${interactive ? ' interactive' : ''}`}
      onPointerMove={interactive ? (e) => setHover(fromEvent(e)) : undefined}
      onPointerLeave={interactive ? () => setHover(null) : undefined}
      onPointerDown={interactive ? (e) => onAnswer(fromEvent(e)) : undefined}
    >
      {xTicks.map((t) => (
        <div key={`x${t.pos}`} className="studio-plane-xtick" style={{ left: `${t.pos * 100}%` }}>
          <div className="line" />
          <span>{t.label}</span>
        </div>
      ))}
      {yTicks.map((t) => (
        <div key={`y${t.pos}`} className="studio-plane-ytick" style={{ top: `${t.pos * 100}%` }}>
          <div className="line" />
          <span>{t.label}</span>
        </div>
      ))}

      {interactive && hover && (
        <>
          <div className="studio-plane-cross v" style={{ left: `${hover.x * 100}%` }} />
          <div className="studio-plane-cross h" style={{ top: `${hover.y * 100}%` }} />
          <div
            className="studio-plane-readout"
            style={{ left: `${hover.x * 100}%`, top: `${hover.y * 100}%` }}
          >
            {format(hover)}
          </div>
        </>
      )}

      {reveal && (
        <>
          <div className="studio-plane-dot yours" style={{ left: `${reveal.yours.x * 100}%`, top: `${reveal.yours.y * 100}%` }} />
          <div className="studio-plane-dot correct" style={{ left: `${reveal.correct.x * 100}%`, top: `${reveal.correct.y * 100}%` }}>
            <div className="studio-plane-dotlabel">{format(reveal.correct)}</div>
          </div>
        </>
      )}
    </div>
  );
}
