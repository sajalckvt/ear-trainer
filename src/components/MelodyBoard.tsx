import { useEffect, useMemo } from 'react';
import { pm, type InstrumentId } from '../audio/engine';
import type { MelodyPayload } from '../exercises/melody';
import type { Question } from '../exercises/types';
import { useMelodyRound } from '../hooks/useMelodyRound';
import { NN } from '../data/constants';

const PITCH_COLORS = [
  '#818cf8','#ef4444','#f97316','#eab308','#22c55e',
  '#14b8a6','#a855f7','#3b82f6','#ec4899','#f43f5e',
  '#8b5cf6','#06b6d4',
];
const nc  = (m: number) => PITCH_COLORS[((m % 12) + 12) % 12];
const nn  = (m: number) => NN[((m % 12) + 12) % 12];
const blk = (m: number) => [1,3,6,8,10].includes(((m % 12) + 12) % 12);

const ROW_H   = 18;
const PX_BEAT = 52;
const PAD     = 1;

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

  // Pre-compute time positions and pitch range
  const { positions, totalBeats, minM, maxM } = useMemo(() => {
    let beat = 0;
    const positions = melody.notes.map(note => {
      const p = { startBeat: beat, beats: note.beats };
      beat += note.beats;
      return p;
    });
    const mids = melody.notes.map(n => n.midi);
    return { positions, totalBeats: beat, minM: Math.min(...mids) - PAD, maxM: Math.max(...mids) + PAD };
  }, [melody]);

  const rows  = maxM - minM + 1;
  const rollH = rows * ROW_H;
  const rollW = totalBeats * PX_BEAT;

  // Auto-play with gaps on mount
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
      const isB = blankIndices.includes(idx);
      if (isB ? mid !== null : true) pm(instrument, isB ? mid! : note.midi, t);
      t += note.beats * (60 / melody.bpm);
    });
  };

  const hasPlaced = Object.values(assignments).some(Boolean);
  const doneCount = blankIndices.filter(i => locked.has(i)).length;

  return (
    <div className="mb">

      {/* Header */}
      <div className="mb-hdr">
        <div>
          <span className="mb-song">{melody.title}</span>
          <span className="mb-artist"> — {melody.artist}</span>
        </div>
        <span className="mb-prog">
          {allDone
            ? <span style={{ color: '#22c55e', fontWeight: 700 }}>✓ Complete</span>
            : `${doneCount} / ${blankIndices.length} correct`}
        </span>
      </div>

      {/* Piano roll */}
      <div className="mb-roll-outer">

        {/* Key column — every note labelled, Ableton style */}
        <div className="mb-keys" style={{ height: rollH }}>
          {Array.from({ length: rows }, (_, i) => {
            const midi = maxM - i;
            const isBlack = blk(midi);
            const isC = midi % 12 === 0;
            const oct = Math.floor(midi / 12) - 1;
            const label = isC ? `${nn(midi)}${oct}` : nn(midi);
            return (
              <div
                key={midi}
                className={`mb-key ${isBlack ? 'bk' : 'wk'}${isC ? ' Cnote' : ''}`}
                style={{ height: ROW_H }}
                onClick={() => pm(instrument, midi, 0)}
                title={`Play ${nn(midi)}${oct}`}
              >
                <span>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Scrollable roll */}
        <div className="mb-roll-scroll">
          <div style={{ width: rollW, height: rollH, position: 'relative' }}>

            {/* Row backgrounds */}
            {Array.from({ length: rows }, (_, i) => {
              const midi = maxM - i;
              return (
                <div key={`r${midi}`} style={{
                  position: 'absolute', top: i * ROW_H, left: 0,
                  width: rollW, height: ROW_H,
                  background: blk(midi) ? '#14141e' : '#1c1c2c',
                  borderBottom: midi % 12 === 0 ? '1px solid #2a2a42' : '1px solid #191928',
                }} />
              );
            })}

            {/* Beat lines */}
            {Array.from({ length: Math.ceil(totalBeats) + 1 }, (_, i) => (
              <div key={`b${i}`} style={{
                position: 'absolute', top: 0, left: i * PX_BEAT,
                width: 1, height: rollH, background: '#26263a', zIndex: 1,
              }} />
            ))}

            {/* Notes and blank columns */}
            {melody.notes.map((note, idx) => {
              const { startBeat, beats } = positions[idx];
              const x = startBeat * PX_BEAT;
              const w = beats * PX_BEAT - 2;
              const isBlankNote = blankIndices.includes(idx);
              const color = nc(note.midi);

              // ── Revealed note ──
              if (!isBlankNote) {
                const y = (maxM - note.midi) * ROW_H;
                return (
                  <button
                    key={idx}
                    onClick={() => pm(instrument, note.midi, 0)}
                    style={{
                      position: 'absolute', left: x, top: y + 1,
                      width: w, height: ROW_H - 2, zIndex: 3,
                      background: `color-mix(in srgb, ${color} 24%, #1c1c2c)`,
                      border: `1px solid ${color}cc`,
                      borderRadius: 3, color,
                      fontSize: 9, fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: 'pointer', padding: '0 3px',
                      display: 'flex', alignItems: 'center',
                      overflow: 'hidden', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.5)')}
                    onMouseLeave={e => (e.currentTarget.style.filter = '')}
                  >
                    {w > 16 ? nn(note.midi) : ''}
                  </button>
                );
              }

              // ── Blank note ──
              const tileKey  = assignments[idx] ?? null;
              const mid      = tileKey ? parseInt(tileKey.split('_')[0]) : null;
              const result   = results[idx] ?? null;
              const isLocked = locked.has(idx);
              const isTarget = selection?.type === 'blank' && selection.idx === idx;

              // Once assigned or locked: show note at its pitch row
              if (mid !== null) {
                const y = (maxM - (isLocked ? note.midi : mid)) * ROW_H;
                const c = isLocked ? '#22c55e' : (result === 'wrong' ? '#ef4444' : nc(mid));
                const bg = isLocked ? '#22c55e18'
                  : result === 'wrong' ? '#ef444420'
                  : `color-mix(in srgb, ${nc(mid)} 18%, #1c1c2c)`;
                return (
                  <button
                    key={idx}
                    onClick={() => !isLocked && tapBlank(idx)}
                    disabled={isLocked}
                    style={{
                      position: 'absolute', left: x, top: y + 1,
                      width: w, height: ROW_H - 2, zIndex: 4,
                      background: bg,
                      border: `1px solid ${c}88`,
                      borderRadius: 3, color: c,
                      fontSize: 9, fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: isLocked ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', padding: '0 3px',
                      animation: result === 'wrong' ? 'mb-shake .4s ease' : undefined,
                    }}
                  >
                    {w > 16 ? nn(mid) : ''}
                  </button>
                );
              }

              // Empty blank: full-height column, no pitch revealed
              return (
                <div
                  key={idx}
                  onClick={() => tapBlank(idx)}
                  style={{
                    position: 'absolute', left: x, top: 0,
                    width: w, height: rollH, zIndex: 2,
                    border: isTarget ? '1.5px solid #6366f1' : '1.5px dashed #2e2e48',
                    borderRadius: 3,
                    background: isTarget ? '#6366f110' : 'transparent',
                    cursor: 'pointer',
                    animation: isTarget ? 'mb-pulse .9s ease-in-out infinite' : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Tile pool */}
      {!allDone && poolTiles.length > 0 && (
        <div className="mb-pool-section">
          <span className="mb-pool-label">
            {selection?.type === 'tile'
              ? '▸ Now click the blank column in the roll'
              : 'Tap a note to select, then click the blank'}
          </span>
          <div className="mb-pool">
            {poolTiles.map(tile => {
              const picked = selection?.type === 'tile' && selection.key === tile.key;
              return (
                <button
                  key={tile.key}
                  className={`mb-tile${picked ? ' picked' : ''}`}
                  style={{ '--nc': nc(tile.midi) } as React.CSSProperties}
                  onClick={() => tapTile(tile.key)}
                >
                  {nn(tile.midi)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mb-actions">
        <button className="abtn rpb" onClick={playGapped}>▶ Play (gaps)</button>
        {hasPlaced && <button className="abtn rpb" onClick={playFull}>▶ Play (filled)</button>}
        {allDone && <button className="abtn nxb" onClick={onNext}>Next →</button>}
      </div>
    </div>
  );
}
