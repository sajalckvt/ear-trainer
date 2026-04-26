import { useEffect, useMemo } from 'react';
import { pm, type InstrumentId } from '../audio/engine';
import type { MelodyPayload } from '../exercises/melody';
import type { Question } from '../exercises/types';
import { useMelodyRound } from '../hooks/useMelodyRound';
import { NN } from '../data/constants';

// ── Color helpers ─────────────────────────────────────────────────────────
const PITCH_COLORS = [
  '#818cf8','#ef4444','#f97316','#eab308','#22c55e',
  '#14b8a6','#a855f7','#3b82f6','#ec4899','#f43f5e',
  '#8b5cf6','#06b6d4',
];
const nc = (midi: number) => PITCH_COLORS[((midi % 12) + 12) % 12];
const nn = (midi: number) => NN[((midi % 12) + 12) % 12];
const isBlack = (midi: number) => [1,3,6,8,10].includes(((midi % 12) + 12) % 12);

// ── Layout constants ──────────────────────────────────────────────────────
const ROW_H    = 18;   // px per semitone row
const PX_BEAT  = 52;   // px per quarter-note beat
const PAD      = 1;    // semitone padding above/below range

interface Props {
  question: Question & { payload: MelodyPayload };
  instrument: InstrumentId;
  onComplete: (clean: boolean) => void;
  onNext: () => void;
}

export function MelodyBoard({ question, instrument, onComplete, onNext }: Props) {
  const payload = question.payload as MelodyPayload;
  const { melody, blankIndices } = payload;

  const { poolTiles, assignments, selection, results, locked, allDone, tapBlank, tapTile } =
    useMelodyRound(payload, onComplete);

  // ── Pre-compute layout geometry ─────────────────────────────────────────
  const { positions, totalBeats, minM, maxM } = useMemo(() => {
    let beat = 0;
    const positions = melody.notes.map(note => {
      const p = { startBeat: beat, beats: note.beats };
      beat += note.beats;
      return p;
    });
    const mids = melody.notes.map(n => n.midi);
    return {
      positions,
      totalBeats: beat,
      minM: Math.min(...mids) - PAD,
      maxM: Math.max(...mids) + PAD,
    };
  }, [melody]);

  const rows      = maxM - minM + 1;
  const rollH     = rows * ROW_H;
  const rollW     = totalBeats * PX_BEAT;

  // ── Auto-play with gaps on mount ─────────────────────────────────────────
  useEffect(() => {
    let t = 0;
    melody.notes.forEach((note, idx) => {
      if (!blankIndices.includes(idx)) pm(instrument, note.midi, t);
      t += note.beats * (60 / melody.bpm);
    });
  }, [(question as unknown as { pickId: unknown }).pickId]); // eslint-disable-line

  const playGapped = () => {
    let t = 0;
    melody.notes.forEach((note, idx) => {
      if (!blankIndices.includes(idx)) pm(instrument, note.midi, t);
      t += note.beats * (60 / melody.bpm);
    });
  };

  const playFull = () => {
    let t = 0;
    melody.notes.forEach((note, idx) => {
      const key = assignments[idx];
      const mid = key ? parseInt(key.split('_')[0]) : null;
      const isBlankNote = blankIndices.includes(idx);
      if (isBlankNote ? mid !== null : true) pm(instrument, isBlankNote ? mid! : note.midi, t);
      t += note.beats * (60 / melody.bpm);
    });
  };

  const hasPlaced  = Object.values(assignments).some(Boolean);
  const doneCount  = blankIndices.filter(i => locked.has(i)).length;

  return (
    <div className="mb">

      {/* ── Header ── */}
      <div className="mb-hdr">
        <div>
          <span className="mb-song">{melody.title}</span>
          <span className="mb-artist"> — {melody.artist}</span>
        </div>
        <span className="mb-prog">
          {allDone
            ? <span style={{color:'#22c55e', fontWeight:700}}>✓ Complete</span>
            : `${doneCount} / ${blankIndices.length} correct`}
        </span>
      </div>

      {/* ── Piano roll ── */}
      <div className="mb-roll-outer">
        {/* Piano key column */}
        <div className="mb-keys" style={{ height: rollH }}>
          {Array.from({ length: rows }, (_, i) => {
            const midi = maxM - i;
            const black = isBlack(midi);
            const showName = !black && (midi % 12 === 0 || melody.notes.some(n => n.midi === midi));
            return (
              <div
                key={midi}
                className={`mb-key ${black ? 'bk' : 'wk'}`}
                style={{ height: ROW_H }}
                onClick={() => pm(instrument, midi, 0)}
                title={`Play ${nn(midi)}${Math.floor(midi/12)-1}`}
              >
                {showName && <span>{nn(midi)}{Math.floor(midi/12)-1}</span>}
              </div>
            );
          })}
        </div>

        {/* Scrollable roll */}
        <div className="mb-roll-scroll">
          <div className="mb-roll-inner" style={{ width: rollW, height: rollH, position: 'relative' }}>

            {/* Row backgrounds */}
            {Array.from({ length: rows }, (_, i) => {
              const midi = maxM - i;
              const black = isBlack(midi);
              return (
                <div
                  key={`row-${midi}`}
                  style={{
                    position: 'absolute', top: i * ROW_H, left: 0,
                    width: rollW, height: ROW_H,
                    background: black ? '#15151f' : '#1e1e2d',
                    borderBottom: midi % 12 === 0 ? '1px solid #2e2e48' : '1px solid #1a1a28',
                  }}
                />
              );
            })}

            {/* Beat grid lines */}
            {Array.from({ length: Math.ceil(totalBeats) + 1 }, (_, i) => (
              <div
                key={`beat-${i}`}
                style={{
                  position: 'absolute', top: 0, left: i * PX_BEAT,
                  width: 1, height: rollH,
                  background: '#28283c', zIndex: 1,
                }}
              />
            ))}

            {/* Notes */}
            {melody.notes.map((note, idx) => {
              const { startBeat, beats } = positions[idx];
              const x = startBeat * PX_BEAT;
              const y = (maxM - note.midi) * ROW_H;
              const w = beats * PX_BEAT - 2;
              const h = ROW_H - 2;
              const isBlankNote = blankIndices.includes(idx);
              const color = nc(note.midi);

              if (!isBlankNote) {
                return (
                  <button
                    key={idx}
                    onClick={() => pm(instrument, note.midi, 0)}
                    title={`${nn(note.midi)}${Math.floor(note.midi/12)-1}`}
                    style={{
                      position: 'absolute', left: x, top: y + 1,
                      width: w, height: h, zIndex: 2,
                      background: `color-mix(in srgb, ${color} 22%, #1e1e2d)`,
                      border: `1px solid ${color}aa`,
                      borderRadius: 3,
                      color,
                      fontSize: 9, fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: 'pointer', padding: '0 3px',
                      display: 'flex', alignItems: 'center',
                      overflow: 'hidden', whiteSpace: 'nowrap',
                      transition: 'filter .1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.4)')}
                    onMouseLeave={e => (e.currentTarget.style.filter = '')}
                  >
                    {w > 18 ? nn(note.midi) : ''}
                  </button>
                );
              }

              // ── Blank note ──
              const tileKey   = assignments[idx] ?? null;
              const mid       = tileKey ? parseInt(tileKey.split('_')[0]) : null;
              const result    = results[idx] ?? null;
              const isLocked  = locked.has(idx);
              const isTarget  = selection?.type === 'blank' && selection.idx === idx;

              let bg = '#0d0d18';
              let border = '1.5px dashed #3a3a58';
              let textCol = '#444';
              let anim = '';

              if (isLocked) {
                bg = '#22c55e18'; border = `1.5px solid #22c55e66`; textCol = '#22c55e';
              } else if (result === 'wrong') {
                bg = '#ef444418'; border = `1.5px solid #ef444466`; textCol = '#ef4444';
                anim = 'mb-shake .4s ease';
              } else if (mid) {
                const c = nc(mid);
                bg = `color-mix(in srgb, ${c} 14%, #0d0d18)`;
                border = `1.5px solid ${c}66`;
                textCol = c;
              } else if (isTarget) {
                bg = '#6366f115'; border = '1.5px solid #6366f1';
                textCol = '#818cf8';
                anim = 'mb-pulse .9s ease-in-out infinite';
              }

              const label = (isLocked || mid) ? (mid ? nn(mid) : '?')
                : isTarget ? '▸' : '?';

              return (
                <button
                  key={idx}
                  onClick={() => tapBlank(idx)}
                  disabled={isLocked}
                  style={{
                    position: 'absolute', left: x, top: y + 1,
                    width: w, height: h, zIndex: 3,
                    background: bg, border,
                    borderRadius: 3, color: textCol,
                    fontSize: 9, fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    cursor: isLocked ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: anim,
                  }}
                >
                  {w > 14 ? label : ''}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Answer tile pool ── */}
      {!allDone && poolTiles.length > 0 && (
        <div className="mb-pool-section">
          <span className="mb-pool-label">
            {selection?.type === 'tile' ? '▸ Now tap a blank in the roll' : 'Tap a note to place it'}
          </span>
          <div className="mb-pool">
            {poolTiles.map(tile => {
              const picked = selection?.type === 'tile' && selection.key === tile.key;
              const color = nc(tile.midi);
              return (
                <button
                  key={tile.key}
                  className={`mb-tile${picked ? ' picked' : ''}`}
                  style={{ '--nc': color } as React.CSSProperties}
                  onClick={() => tapTile(tile.key)}
                >
                  {nn(tile.midi)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="mb-actions">
        <button className="abtn rpb" onClick={playGapped}>▶ Play (gaps)</button>
        {hasPlaced && <button className="abtn rpb" onClick={playFull}>▶ Play (filled)</button>}
        {allDone && <button className="abtn nxb" onClick={onNext}>Next →</button>}
      </div>
    </div>
  );
}
