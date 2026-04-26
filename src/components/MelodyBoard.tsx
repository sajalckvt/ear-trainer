import { useEffect } from 'react';
import { pm, type InstrumentId } from '../audio/engine';
import type { MelodyPayload } from '../exercises/melody';
import type { Question } from '../exercises/types';
import { useMelodyRound } from '../hooks/useMelodyRound';
import { NN } from '../data/constants';

// 12-color palette matching pitch exercise
const NOTE_COLORS = [
  '#818cf8','#ef4444','#f97316','#eab308','#22c55e',
  '#14b8a6','#a855f7','#3b82f6','#ec4899','#f43f5e',
  '#8b5cf6','#06b6d4',
];
function noteColor(midi: number) {
  return NOTE_COLORS[((midi % 12) + 12) % 12];
}
function noteName(midi: number) {
  return NN[((midi % 12) + 12) % 12];
}

interface MelodyBoardProps {
  question: Question & { payload: MelodyPayload };
  instrument: InstrumentId;
  onComplete: (clean: boolean) => void;
  onNext: () => void;
}

export function MelodyBoard({ question, instrument, onComplete, onNext }: MelodyBoardProps) {
  const payload = question.payload as MelodyPayload;
  const { melody, blankIndices } = payload;

  const {
    poolTiles, assignments, selection, results, locked, allDone,
    tapBlank, tapTile,
  } = useMelodyRound(payload, onComplete);

  // Auto-play melody with gaps when question loads
  useEffect(() => {
    const beatSec = 60 / melody.bpm;
    let t = 0;
    melody.notes.forEach((note, idx) => {
      if (!blankIndices.includes(idx)) pm(instrument, note.midi, t);
      t += note.beats * beatSec;
    });
  }, [String((question as unknown as {pickId: unknown}).pickId)]); // eslint-disable-line react-hooks/exhaustive-deps

  function playGapped() {
    const beatSec = 60 / melody.bpm;
    let t = 0;
    melody.notes.forEach((note, idx) => {
      if (!blankIndices.includes(idx)) pm(instrument, note.midi, t);
      t += note.beats * beatSec;
    });
  }

  function playFull() {
    const beatSec = 60 / melody.bpm;
    let t = 0;
    melody.notes.forEach((note, idx) => {
      const isBlank = blankIndices.includes(idx);
      if (isBlank) {
        const key = assignments[idx];
        const assigned = key ? parseInt(key.split('_')[0]) : null;
        if (assigned !== null) pm(instrument, assigned, t);
      } else {
        pm(instrument, note.midi, t);
      }
      t += note.beats * beatSec;
    });
  }

  return (
    <div className="mb-wrap">
      {/* Title + melody name */}
      <div className="mb-title">
        <span className="mb-song">{melody.title}</span>
        <span className="mb-hint">
          {blankIndices.length} missing note{blankIndices.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Note boxes — horizontally scrollable */}
      <div className="mb-scroll-wrap">
        <div className="mb-notes">
          {melody.notes.map((note, idx) => {
            const isBlank = blankIndices.includes(idx);
            if (!isBlank) {
              // Revealed note — clickable to play
              const col = noteColor(note.midi);
              return (
                <button
                  key={idx}
                  className="mb-note revealed"
                  style={{ '--nc': col } as React.CSSProperties}
                  onClick={() => pm(instrument, note.midi, 0)}
                  title={`Play ${noteName(note.midi)}`}
                >
                  {noteName(note.midi)}
                </button>
              );
            }

            // Blank position
            const tileKey = assignments[idx] ?? null;
            const assignedMidi = tileKey ? parseInt(tileKey.split('_')[0]) : null;
            const result = results[idx] ?? null;
            const isLocked = locked.has(idx);
            const isSelectedBlank = selection?.type === 'blank' && selection.idx === idx;

            let cls = 'mb-note blank';
            if (isLocked) cls += ' correct';
            else if (result === 'wrong') cls += ' wrong';
            else if (assignedMidi !== null) cls += ' assigned';
            else if (isSelectedBlank) cls += ' target';

            const col = assignedMidi !== null ? noteColor(assignedMidi) : '#6366f1';

            return (
              <button
                key={idx}
                className={cls}
                style={{ '--nc': col } as React.CSSProperties}
                onClick={() => tapBlank(idx)}
                disabled={isLocked}
              >
                {isLocked && assignedMidi !== null ? noteName(assignedMidi) :
                 result === 'wrong' && assignedMidi !== null ? noteName(assignedMidi) :
                 assignedMidi !== null ? noteName(assignedMidi) :
                 isSelectedBlank ? '→' : '?'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer tile pool */}
      {!allDone && (
        <div className="mb-pool">
          {poolTiles.map((tile) => {
            const isSelected = selection?.type === 'tile' && selection.key === tile.key;
            const col = noteColor(tile.midi);
            return (
              <button
                key={tile.key}
                className={`mb-tile${isSelected ? ' picked' : ''}`}
                style={{ '--nc': col } as React.CSSProperties}
                onClick={() => tapTile(tile.key)}
              >
                {noteName(tile.midi)}
              </button>
            );
          })}
        </div>
      )}

      {/* Action row */}
      <div className="mb-actions">
        <button className="abtn rpb" onClick={playGapped}>🔈 Play (gaps)</button>
        {Object.values(assignments).some(Boolean) && (
          <button className="abtn rpb" onClick={playFull}>🔈 Play (filled)</button>
        )}
        {allDone && (
          <button className="abtn nxb" onClick={onNext}>Next →</button>
        )}
      </div>

      {allDone && (
        <div className="mb-done">
          ✓ Complete!
        </div>
      )}
    </div>
  );
}
