import { NN, ND, IVS, CHORDS, INSTS } from '../data/constants';
import { pn, pm, type InstrumentId } from '../audio/engine';
import { m2n } from '../audio/theory';
import { InstrumentPicker } from '../components/Controls';

interface ReferencePageProps {
  visible: boolean;
  instrument: InstrumentId;
  onInstrumentChange: (id: InstrumentId) => void;
}

export function ReferencePage({ visible, instrument, onInstrumentChange }: ReferencePageProps) {
  return (
    <div className={`screen${visible ? ' vis' : ''}`}>
      <div className="bl" style={{ marginBottom: 10 }}>Instrument sampler</div>
      <InstrumentPicker instrument={instrument} onChange={onInstrumentChange} />

      {/* Individual notes C4..C5 */}
      <div style={{ margin: '10px 0' }}><span className="bl">Play notes</span></div>
      <div className="snotes">
        {Array.from({ length: 13 }, (_, i) => {
          const nn = NN[i % 12];
          const dn = ND[i % 12];
          const oct = i < 12 ? 4 : 5;
          return (
            <button
              key={i}
              className={`snb${nn.length > 1 ? ' bk2' : ''}`}
              onClick={() => pn(instrument, nn + oct, 0)}
            >
              {dn}{oct}
            </button>
          );
        })}
      </div>

      {/* Intervals from C4 */}
      <div style={{ margin: '10px 0' }}><span className="bl">Play intervals from C4</span></div>
      <div className="ag" style={{ marginBottom: 20 }}>
        {IVS.slice(0, 13).map((iv) => (
          <button
            key={iv.sh}
            className="ab"
            onClick={() => {
              pn(instrument, 'C4', 0);
              setTimeout(() => pn(instrument, m2n(60 + iv.st), 0), 750);
            }}
          >
            <span className="sh">{iv.sh}</span>
            {iv.n}
            <span className="st-count">{iv.st}st</span>
          </button>
        ))}
      </div>

      {/* Interval reference sheet grouped by category */}
      <div className="bl" style={{ marginBottom: 10 }}>Interval reference</div>
      <IntervalReferenceSheet instrument={instrument} />

      {/* Chord reference */}
      <div style={{ marginTop: 16 }}>
        <div className="bl" style={{ marginBottom: 10 }}>Chord / Triad reference</div>
      </div>
      <ChordReferenceSheet instrument={instrument} />

      {/* Cadence voicings */}
      <div style={{ marginTop: 16 }}>
        <div className="bl" style={{ marginBottom: 10 }}>Cadence voicings</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          Tap to hear different I–IV–V voicings in C
        </div>
        <CadenceVoicings instrument={instrument} />
      </div>
    </div>
  );
}

function IntervalReferenceSheet({ instrument }: { instrument: InstrumentId }) {
  const sections = [
    { l: 'Seconds', iv: [1, 2] },
    { l: 'Thirds', iv: [3, 4] },
    { l: 'Perfect intervals', iv: [5, 6, 7] },
    { l: 'Sixths', iv: [8, 9] },
    { l: 'Sevenths & octave', iv: [10, 11, 12] },
  ];

  return (
    <>
      {sections.map((sec) => (
        <div key={sec.l}>
          <div className="rsec">{sec.l}</div>
          {sec.iv.map((idx) => {
            const iv = IVS[idx];
            return (
              <div key={idx} className="rc">
                <div className="rcr">
                  <div className="rcb" style={{ background: iv.co }}>
                    <span>{iv.sh}</span>
                    <span className="bs">{iv.st}st</span>
                  </div>
                  <div className="rcn">
                    <span className="rn">{iv.n}</span>
                    <span className="rs">{iv.st} semitone{iv.st !== 1 ? 's' : ''}</span>
                  </div>
                  <div
                    className="rcs"
                    onClick={() => {
                      pn(instrument, 'C4', 0);
                      setTimeout(() => pn(instrument, m2n(60 + iv.st), 0), 750);
                    }}
                  >
                    {iv.rf}
                    {iv.al && <div className="alt">Also: {iv.al}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

function ChordReferenceSheet({ instrument }: { instrument: InstrumentId }) {
  return (
    <>
      {CHORDS.map((ch) => (
        <div key={ch.id} className="rc">
          <div className="rcr">
            <div className="rcb" style={{ background: ch.co }}>
              <span>{ch.sh}</span>
            </div>
            <div className="rcn">
              <span className="rn">{ch.n}</span>
              <span className="rs">{ch.ex}</span>
              <span className="formula">{ch.songs[0]?.title ?? ''}</span>
            </div>
            <div
              className="rcs"
              onClick={() => {
                const ns = ch.iv;
                ns.forEach((i, j) => pm(instrument, 60 + i, j * 0.3));
                const chordAt = ns.length * 0.3 + 0.15;
                ns.forEach((i) => pm(instrument, 60 + i, chordAt));
              }}
            >
              <div style={{ fontWeight: 600, color: '#ccc' }}>{ch.fmd}</div>
              <div className="alt">Tap to hear</div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

function CadenceVoicings({ instrument }: { instrument: InstrumentId }) {
  const voicings = [
    {
      n: 'Single notes',
      fn: () => {
        pm(instrument, 60, 0);
        setTimeout(() => pm(instrument, 65, 0), 400);
        setTimeout(() => pm(instrument, 67, 0), 800);
        setTimeout(() => pm(instrument, 60, 0), 1200);
      },
    },
    {
      n: 'Power chords',
      fn: () => {
        [60, 67].forEach((n) => pm(instrument, n, 0));
        setTimeout(() => [65, 72].forEach((n) => pm(instrument, n, 0)), 500);
        setTimeout(() => [67, 74].forEach((n) => pm(instrument, n, 0)), 1000);
        setTimeout(() => [60, 67].forEach((n) => pm(instrument, n, 0)), 1500);
      },
    },
    {
      n: 'Full triads',
      fn: () => {
        [60, 64, 67].forEach((n) => pm(instrument, n, 0));
        setTimeout(() => [65, 69, 72].forEach((n) => pm(instrument, n, 0)), 500);
        setTimeout(() => [67, 71, 74].forEach((n) => pm(instrument, n, 0)), 1000);
        setTimeout(() => [60, 64, 67].forEach((n) => pm(instrument, n, 0)), 1500);
      },
    },
  ];

  return (
    <div className="ag">
      {voicings.map((v) => (
        <button key={v.n} className="ab" style={{ minWidth: 100 }} onClick={v.fn}>
          {v.n}
        </button>
      ))}
    </div>
  );
}

// Also export INSTS type usage for tree-shaking unification
export const __INSTS_USED = INSTS.length;
