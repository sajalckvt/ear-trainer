import { useEffect } from 'react';
import { pm, type InstrumentId } from '../audio/engine';
import type { MelodyPayload } from '../exercises/melody';
import type { Question } from '../exercises/types';
import { useMelodyRound } from '../hooks/useMelodyRound';
import { NN } from '../data/constants';

const NOTE_COLORS = [
  '#818cf8','#ef4444','#f97316','#eab308','#22c55e',
  '#14b8a6','#a855f7','#3b82f6','#ec4899','#f43f5e',
  '#8b5cf6','#06b6d4',
];
const nc = (midi: number) => NOTE_COLORS[((midi % 12) + 12) % 12];
const nn = (midi: number) => NN[((midi % 12) + 12) % 12];

interface Props {
  question: Question & { payload: MelodyPayload };
  instrument: InstrumentId;
  onComplete: (clean: boolean) => void;
  onNext: () => void;
}

export function MelodyBoard({ question, instrument, onComplete, onNext }: Props) {
  const payload = question.payload as MelodyPayload;
  const { melody, blankIndices } = payload;

  const {
    poolTiles, assignments, selection, results, locked, allDone,
    tapBlank, tapTile,
  } = useMelodyRound(payload, onComplete);

  // Auto-play melody with gaps on mount
  useEffect(() => {
    const beatSec = 60 / melody.bpm;
    let t = 0;
    melody.notes.forEach((note, idx) => {
      if (!blankIndices.includes(idx)) pm(instrument, note.midi, t);
      t += note.beats * beatSec;
    });
  }, [(question as unknown as {pickId: unknown}).pickId]); // eslint-disable-line

  const playGapped = () => {
    const beatSec = 60 / melody.bpm;
    let t = 0;
    melody.notes.forEach((note, idx) => {
      if (!blankIndices.includes(idx)) pm(instrument, note.midi, t);
      t += note.beats * beatSec;
    });
  };

  const playFull = () => {
    const beatSec = 60 / melody.bpm;
    let t = 0;
    melody.notes.forEach((note, idx) => {
      const isBlank = blankIndices.includes(idx);
      if (isBlank) {
        const key = assignments[idx];
        const mid = key ? parseInt(key.split('_')[0]) : null;
        if (mid !== null) pm(instrument, mid, t);
      } else {
        pm(instrument, note.midi, t);
      }
      t += note.beats * beatSec;
    });
  };

  const placedCount = blankIndices.filter(i => locked.has(i)).length;
  const hasAnyPlaced = Object.values(assignments).some(Boolean);

  return (
    <div className="mb">

      {/* Header */}
      <div className="mb-hdr">
        <div>
          <span className="mb-song">{melody.title}</span>
          <span className="mb-artist"> — {melody.artist}</span>
        </div>
        <div className="mb-progress">
          {allDone
            ? <span style={{color:'#22c55e'}}>✓ Complete</span>
            : <span>{placedCount}/{blankIndices.length} correct</span>}
        </div>
      </div>

      {/* Note sequence */}
      <div className="mb-scroll">
        <div className="mb-row">
          {melody.notes.map((note, idx) => {
            const isBlank = blankIndices.includes(idx);

            if (!isBlank) {
              return (
                <button
                  key={idx}
                  className="mb-box revealed"
                  style={{ '--nc': nc(note.midi) } as React.CSSProperties}
                  onClick={() => pm(instrument, note.midi, 0)}
                  title={nn(note.midi)}
                >
                  {nn(note.midi)}
                </button>
              );
            }

            const tileKey = assignments[idx] ?? null;
            const mid = tileKey ? parseInt(tileKey.split('_')[0]) : null;
            const result = results[idx] ?? null;
            const isLocked = locked.has(idx);
            const isTarget = selection?.type === 'blank' && selection.idx === idx;

            let cls = 'mb-box blank';
            if (isLocked)          cls += ' correct';
            else if (result === 'wrong') cls += ' wrong';
            else if (mid !== null)  cls += ' assigned';
            else if (isTarget)      cls += ' target';

            return (
              <button
                key={idx}
                className={cls}
                style={{ '--nc': mid ? nc(mid) : '#6366f1' } as React.CSSProperties}
                onClick={() => tapBlank(idx)}
                disabled={isLocked}
              >
                {isLocked && mid ? nn(mid)
                  : mid ? nn(mid)
                  : isTarget ? '▸' : '?'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer pool */}
      {!allDone && poolTiles.length > 0 && (
        <div className="mb-pool-wrap">
          <span className="mb-pool-label">Tap a note, then tap a blank</span>
          <div className="mb-pool">
            {poolTiles.map((tile) => {
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
        {hasAnyPlaced && <button className="abtn rpb" onClick={playFull}>▶ Play (filled)</button>}
        {allDone && <button className="abtn nxb" onClick={onNext}>Next →</button>}
      </div>
    </div>
  );
}
