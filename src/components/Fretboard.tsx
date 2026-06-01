import { ND, GS } from '../data/constants';

interface FretboardProps {
  highlights: Record<number, string>;
  /**
   * Optional CAGED shape overlay. When provided, the fretboard shows ONLY
   * this shape's fretted notes (low E → high e; -1 = muted) instead of every
   * pitch-class match. `rootPc` marks which notes are the chord root (drawn
   * in the accent colour). `shapeName`/`onCycle` drive the position cycler.
   */
  shape?: {
    frets: number[];
    rootPc: number;
    shapeName: string;
    onCycle: () => void;
    positionLabel: string;
  };
}

const FRETS = 15;
const BW = 600;  // fretboard width
const SS = 20;   // string spacing
const TP = 22;   // top padding
const LP = 32;   // left padding (for string labels)

// Fret X position using Rule of 18 (≈0.944 compression per fret)
function fX(f: number): number {
  if (f === 0) return LP;
  return LP + 6 + (1 - Math.pow(0.944, f)) * (BW - 6);
}

function mX(f: number): number {
  return f === 0 ? LP + 3 : (fX(f) + fX(f + 1)) / 2;
}

function sY(s: number): number {
  return TP + (s + 1) * SS;
}

export function Fretboard({ highlights, shape }: FretboardProps) {
  const width = BW + LP + 16;
  const height = SS * 7 + TP + 10;

  // Build fret lines
  const fretLines: React.ReactElement[] = [];
  for (let f = 0; f < FRETS; f++) {
    const x = fX(f + 1);
    fretLines.push(
      <line
        key={`fret-${f}`}
        x1={x} y1={TP + SS * 0.5}
        x2={x} y2={TP + SS * 6.5}
        stroke="#bbb" strokeWidth={1.8} opacity={0.6}
      />
    );
  }

  // Fret numbers
  const fretNumbers: React.ReactElement[] = [];
  for (let f = 0; f <= FRETS; f++) {
    fretNumbers.push(
      <text
        key={`fn-${f}`}
        x={f === 0 ? LP + 3 : mX(f)}
        y={TP - 2}
        textAnchor="middle"
        fontSize={8}
        fill="#555"
        fontFamily="JetBrains Mono, monospace"
        fontWeight={600}
      >
        {f}
      </text>
    );
  }

  // Inlay dots at frets 3, 5, 7, 9 (single) and 12 (double)
  const inlays: React.ReactElement[] = [];
  [3, 5, 7, 9, 12].forEach((f) => {
    const cx = mX(f);
    if (f === 12) {
      inlays.push(
        <circle key={`inlay-12a`} cx={cx} cy={sY(1.5)} r={4} fill="#d4c5a0" opacity={0.35} />,
        <circle key={`inlay-12b`} cx={cx} cy={sY(3.5)} r={4} fill="#d4c5a0" opacity={0.35} />
      );
    } else {
      inlays.push(
        <circle key={`inlay-${f}`} cx={cx} cy={sY(2.5)} r={4} fill="#d4c5a0" opacity={0.3} />
      );
    }
  });

  // Strings + labels
  const strings: React.ReactElement[] = [];
  GS.forEach((s, si) => {
    strings.push(
      <text
        key={`lbl-${si}`}
        x={LP - 12} y={sY(si) + 4}
        textAnchor="middle" fontSize={10} fill="#888"
        fontWeight={700} fontFamily="JetBrains Mono, monospace"
      >
        {s.n}
      </text>,
      <line
        key={`str-${si}`}
        x1={LP + 6} y1={sY(si)}
        x2={LP + BW} y2={sY(si)}
        stroke={si >= 3 ? '#a89070' : '#d4c8a8'}
        strokeWidth={s.g}
        opacity={0.7}
      />
    );
  });

  // Highlight dots. Two modes:
  //  (a) CAGED shape overlay → only this shape's fretted notes, root accented.
  //  (b) default → every pitch-class match from `highlights`.
  const dots: React.ReactElement[] = [];
  const muteMarks: React.ReactElement[] = [];

  if (shape) {
    // shape.frets is low E → high e; GS is high e → low E, so map i → 5 - i.
    shape.frets.forEach((f, lowToHigh) => {
      const si = 5 - lowToHigh;                 // GS index
      const stringMidiOpen = GS[si].m;
      if (f < 0) {
        // muted/unplayed string → small ✕ near the nut
        muteMarks.push(
          <text key={`mute-${si}`} x={LP - 12} y={sY(si) + 4}
            textAnchor="middle" fontSize={10} fill="#a33" fontWeight={800}
            fontFamily="JetBrains Mono, monospace">×</text>
        );
        return;
      }
      const midi = stringMidiOpen + f;
      const isRoot = (((midi % 12) + 12) % 12) === shape.rootPc;
      const col = isRoot ? '#f43f5e' : '#6366f1';
      const cx = f === 0 ? LP + 3 : mX(f);
      const cy = sY(si);
      dots.push(
        <g key={`sdot-${si}`} filter="url(#ng)">
          <circle cx={cx} cy={cy} r={9} fill={col} />
          <circle cx={cx} cy={cy} r={9} fill="none" stroke="#fff" strokeWidth={isRoot ? 1.8 : 1.0} opacity={isRoot ? 0.55 : 0.25} />
          <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize={7.5} fill="#fff"
            fontWeight={800} fontFamily="JetBrains Mono, monospace">
            {ND[((midi % 12) + 12) % 12]}
          </text>
        </g>
      );
    });
  } else {
    GS.forEach((s, si) => {
      for (let f = 0; f <= FRETS; f++) {
        const midi = s.m + f;
        const hl = highlights[midi];
        if (!hl) continue;
        const cx = f === 0 ? LP + 3 : mX(f);
        const cy = sY(si);
        dots.push(
          <g key={`dot-${si}-${f}`} filter="url(#ng)">
            <circle cx={cx} cy={cy} r={8.5} fill={hl} />
            <circle cx={cx} cy={cy} r={8.5} fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.25} />
            <text
              x={cx} y={cy + 3.5}
              textAnchor="middle" fontSize={7.5} fill="#fff"
              fontWeight={800} fontFamily="JetBrains Mono, monospace"
            >
              {ND[((midi % 12) + 12) % 12]}
            </text>
          </g>
        );
      }
    });
  }

  return (
    <div className="box">
      <div className="bh">
        <span>🎸</span>
        <span className="bl">Guitar</span>
        {shape && (
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>
              {shape.positionLabel}
            </span>
            <button
              onClick={shape.onCycle}
              style={{
                fontSize: 11, fontWeight: 700, color: '#a78bfa',
                background: 'rgba(167,139,250,0.12)',
                border: '1px solid rgba(167,139,250,0.3)',
                borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
              }}
            >
              {shape.shapeName} · next →
            </button>
          </span>
        )}
      </div>
      <div className="gw">
        <svg width={width} height={height} style={{ display: 'block' }}>
          <defs>
            <filter id="ng">
              <feGaussianBlur stdDeviation={2.5} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Fretboard background */}
          <rect
            x={LP} y={TP + SS * 0.3}
            width={BW} height={SS * 6.4}
            rx={2} fill="#4a3525"
          />
          {/* Nut */}
          <rect
            x={LP} y={TP + SS * 0.5}
            width={6} height={SS * 6}
            rx={1.5} fill="#f5f0e0"
            stroke="#ccc" strokeWidth={0.5}
          />
          {inlays}
          {fretLines}
          {fretNumbers}
          {strings}
          {dots}
          {muteMarks}
        </svg>
      </div>
    </div>
  );
}
