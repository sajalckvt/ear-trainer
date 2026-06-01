import { m2d } from '../audio/theory';
import { SAMPLE_LO, SAMPLE_HI } from '../data/constants';

interface PianoProps {
  /** Map of MIDI → color for highlighted keys. */
  highlights: Record<number, string>;
  /** Optional label shown in the piano header (e.g. "Root: C4" or a note list). */
  headerLabel?: string;
  /** Optional color override for the header label text. */
  headerColor?: string;
  /** If provided, keys become clickable and call this with the MIDI note. */
  onKeyClick?: (midi: number) => void;
}

const KEY_W = 32;

function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

export function Piano({ highlights, headerLabel, headerColor, onKeyClick }: PianoProps) {
  // Build keyset from SAMPLE_LO..SAMPLE_HI
  const keys: Array<{ m: number; b: boolean; nm: string }> = [];
  for (let m = SAMPLE_LO; m <= SAMPLE_HI; m++) {
    keys.push({ m, b: isBlackKey(m), nm: m2d(m) });
  }
  const whiteKeys = keys.filter((k) => !k.b);

  return (
    <div className="box">
      <div className="bh">
        <span>🎹</span>
        <span className="bl">Piano</span>
        <span className="bn" style={{ color: headerColor }}>{headerLabel ?? ''}</span>
      </div>
      <div className="pw">
        <div className="piano" style={{ width: whiteKeys.length * KEY_W }}>
          {whiteKeys.map((k, i) => {
            const hl = highlights[k.m];
            return (
              <div
                key={k.m}
                className="wk"
                onClick={onKeyClick ? () => onKeyClick(k.m) : undefined}
                style={{
                  left: i * KEY_W,
                  width: KEY_W - 2,
                  cursor: onKeyClick ? 'pointer' : 'default',
                  background: hl
                    ? `linear-gradient(180deg, ${hl}cc, ${hl})`
                    : 'linear-gradient(180deg, #fafafa, #e4e4e4)',
                  color: hl ? '#fff' : '#aaa',
                  boxShadow: hl
                    ? 'none'
                    : 'inset 0 -2px 4px rgba(0,0,0,.05)',
                }}
              >
                {hl ? k.nm : ''}
              </div>
            );
          })}
          {keys.filter((k) => k.b).map((k) => {
            let wi = -1;
            for (let j = 0; j < whiteKeys.length; j++) {
              if (whiteKeys[j].m === k.m - 1) { wi = j; break; }
            }
            if (wi < 0) return null;
            const hl = highlights[k.m];
            return (
              <div
                key={k.m}
                className="bk"
                onClick={onKeyClick ? () => onKeyClick(k.m) : undefined}
                style={{
                  left: wi * KEY_W + KEY_W * 0.65,
                  width: KEY_W * 0.55,
                  cursor: onKeyClick ? 'pointer' : 'default',
                  background: hl ? hl : 'linear-gradient(180deg, #2a2a3e, #18182a)',
                  color: hl ? '#fff' : '#555',
                }}
              >
                {hl ? k.nm : ''}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
