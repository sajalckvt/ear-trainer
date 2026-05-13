import { NN, ND, IVS, CHORDS, INSTS } from '../data/constants';
import { PROGRESSION_CHORDS } from '../data/progressions';
import { pn, pm, type InstrumentId } from '../audio/engine';
import { m2n, m2d } from '../audio/theory';
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

      {/* Chord function in a key */}
      <div style={{ marginTop: 16 }}>
        <div className="bl" style={{ marginBottom: 10 }}>Chord function · how chords behave in a key</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          In any key, each chord has a <i>function</i> — does it feel like home, does it want to push, does it lean back? Three families: Tonic, Subdominant, Dominant. Tap each demo to hear how it resolves.
        </div>
        <ChordFunctionSheet instrument={instrument} />
      </div>

      {/* Diatonic chord reference */}
      <div style={{ marginTop: 16 }}>
        <div className="bl" style={{ marginBottom: 10 }}>Diatonic chord reference · Roman numerals in C major</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          Every chord you can build using only notes from the C major scale. Each one has a Roman-numeral name (I, ii, iii…) that tells you which scale degree it's built on. Tap to hear.
        </div>
        <DiatonicChordSheet instrument={instrument} />
      </div>

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

function ChordFunctionSheet({ instrument }: { instrument: InstrumentId }) {
  // C major reference: I = C(60,64,67), ii = Dm(62,65,69),
  // IV = F(65,69,72), V = G(67,71,74), vi = Am(69,72,76), V7 = G7(67,71,74,77)
  const C  = [60, 64, 67];
  const Dm = [62, 65, 69];
  const F  = [65, 69, 72];
  const G  = [67, 71, 74];
  const Am = [69, 72, 76];
  const G7 = [67, 71, 74, 77];

  // Play a sequence of chords; each chord rings, next plays after gap (default 0.9s)
  const playSeq = (chords: number[][], gap = 0.9) => {
    chords.forEach((ch, i) => {
      ch.forEach((n) => pm(instrument, n, i * gap));
    });
  };

  const families = [
    {
      title: 'Tonic — home',
      color: '#22c55e',
      blurb: 'The chord built on the 1st degree of the key. Feels resolved, settled, "home". When music returns to the tonic it feels finished. In C major: I = C. The relative minor (vi = Am) and iii also have a tonic-like flavour because they share most notes with I.',
      examples: [
        { n: 'I (C major) — home, no tension', play: () => playSeq([C]) },
        { n: 'vi (Am) — soft tonic substitute', play: () => playSeq([Am]) },
        { n: 'V → I — dominant resolves home', play: () => playSeq([G, C]) },
      ],
    },
    {
      title: 'Subdominant — push away',
      color: '#3b82f6',
      blurb: 'The chord on the 4th degree (IV) — feels like stepping away from home, opening a window. Doesn\'t feel restless like the dominant, but it doesn\'t feel resolved either. The ii chord also functions as subdominant (it shares notes with IV). In C major: IV = F, ii = Dm.',
      examples: [
        { n: 'I → IV — stepping out', play: () => playSeq([C, F]) },
        { n: 'I → ii — softer subdominant', play: () => playSeq([C, Dm]) },
        { n: 'IV → I — a "plagal" resolution (amen)', play: () => playSeq([F, C]) },
      ],
    },
    {
      title: 'Dominant — wants to resolve',
      color: '#f43f5e',
      blurb: 'The chord on the 5th degree (V). Contains a tritone (in V7) that creates tension — it strongly wants to resolve back to I. This "V wants to go to I" is the engine of Western harmony. Any time you build tension, you usually build a V chord. In C major: V = G, V7 = G7. The vii° (Bdim) also has dominant function — it shares the tritone with V7.',
      examples: [
        { n: 'V → I — classic resolution', play: () => playSeq([G, C]) },
        { n: 'V7 → I — even stronger pull (tritone)', play: () => playSeq([G7, C]) },
        { n: 'I → IV → V → I (full circle)', play: () => playSeq([C, F, G, C], 0.8) },
        { n: 'V → vi (deceptive — "fakes" home)', play: () => playSeq([G, Am]) },
      ],
    },
  ];

  return (
    <>
      {families.map((fam) => (
        <div key={fam.title} className="rc">
          <div className="rcr" style={{ display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: fam.color, flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 700, color: '#d4d4d8', fontSize: 13 }}>{fam.title}</span>
            </div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 10 }}>
              {fam.blurb}
            </div>
            <div className="ag" style={{ marginTop: 4 }}>
              {fam.examples.map((ex) => (
                <button key={ex.n} className="ab" style={{ minWidth: 0, padding: '6px 10px' }} onClick={ex.play}>
                  <span style={{ fontSize: 11 }}>{ex.n}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5, marginTop: 8 }}>
        <strong style={{ color: '#888' }}>Roman numerals:</strong> capital = major chord (I, IV, V), lowercase = minor chord (ii, iii, vi), ° = diminished (vii°). The number tells you which scale degree the chord is built on.
      </div>
    </>
  );
}

function DiatonicChordSheet({ instrument }: { instrument: InstrumentId }) {
  // Group by triads vs sevenths so the visual layout shows the family ladder
  const triadIds = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  const seventhIds = ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'];

  const sections = [
    { l: 'Triads (3-note chords)', ids: triadIds },
    { l: '7th chords (4-note extensions)', ids: seventhIds },
  ];

  // Voice each chord around middle C (the C major key tonic)
  const keyRoot = 60;

  const playChord = (rootOffset: number, intervals: number[]) => {
    let rm = keyRoot + rootOffset;
    // Drop an octave if the chord runs too high (e.g. vii° with root B4 + 6 = F5 is fine,
    // but viiø7 with root B4 + 10 = A5 is too high for the soundfont)
    while (rm + Math.max(...intervals) > 79) rm -= 12;
    while (rm < 57) rm += 12;
    // Arpeggio then stacked, matching ChordReferenceSheet's behaviour
    intervals.forEach((iv, idx) => pm(instrument, rm + iv, idx * 0.22));
    const chordAt = intervals.length * 0.22 + 0.15;
    intervals.forEach((iv) => pm(instrument, rm + iv, chordAt));
  };

  return (
    <>
      {sections.map((sec) => (
        <div key={sec.l}>
          <div className="rsec">{sec.l}</div>
          {sec.ids.map((id) => {
            const ch = PROGRESSION_CHORDS.find((c) => c.id === id);
            if (!ch) return null;
            return (
              <div key={id} className="rc">
                <div className="rcr">
                  <div className="rcb" style={{ background: ch.co }}>
                    <span>{ch.sh}</span>
                  </div>
                  <div className="rcn">
                    <span className="rn">{ch.n}</span>
                    <span className="rs">{ch.ex}</span>
                    <span className="formula" style={{ textTransform: 'capitalize' }}>{ch.fn} function</span>
                  </div>
                  <div className="rcs" onClick={() => playChord(ch.rootOffset, ch.iv)}>
                    <div style={{ fontWeight: 600, color: '#ccc' }}>{noteNamesForChord(keyRoot + ch.rootOffset, ch.iv)}</div>
                    <div className="alt">Tap to hear</div>
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

/** Helper: render the actual note letters of a chord in close root position
 *  starting from `rootMidi`. e.g. (60, [0,4,7]) → "C–E–G". */
function noteNamesForChord(rootMidi: number, intervals: number[]): string {
  return intervals.map((iv) => m2d(rootMidi + iv).replace(/\d/g, '')).join('–');
}

// Also export INSTS type usage for tree-shaking unification
export const __INSTS_USED = INSTS.length;
