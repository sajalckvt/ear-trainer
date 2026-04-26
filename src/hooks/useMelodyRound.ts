import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MelodyPayload } from '../exercises/melody';

export interface Tile { key: string; midi: number; }

type Selection =
  | { type: 'tile'; key: string }
  | { type: 'blank'; idx: number }
  | null;

export type BlankResult = 'correct' | 'wrong' | null;

export function useMelodyRound(
  payload: MelodyPayload,
  onComplete: (clean: boolean) => void,
) {
  const { melody, blankIndices, answerMidis } = payload;

  // One tile per entry in answerMidis (allows duplicate midis as separate tiles)
  const tiles: Tile[] = useMemo(
    () => answerMidis.map((m, i) => ({ key: `${m}_${i}`, midi: m })),
    [answerMidis],
  );

  // blankIndex → tile.key (or null = unassigned)
  const [assignments, setAssignments] = useState<Record<number, string | null>>({});
  const [selection, setSelection] = useState<Selection>(null);
  const [results, setResults] = useState<Record<number, BlankResult>>({});
  const [locked, setLocked] = useState<Set<number>>(new Set());
  const [hadWrong, setHadWrong] = useState(false);

  const correctMidi = useCallback(
    (idx: number) => melody.notes[idx].midi,
    [melody],
  );

  // Available tiles: those not currently placed in any non-locked blank
  const placedKeys = useMemo(() => {
    const s = new Set<string>();
    blankIndices.forEach((idx) => {
      if (!locked.has(idx) && assignments[idx]) s.add(assignments[idx]!);
    });
    return s;
  }, [assignments, blankIndices, locked]);

  const poolTiles = useMemo(
    () => tiles.filter((t) => !placedKeys.has(t.key)),
    [tiles, placedKeys],
  );

  // Auto-check when all blanks are assigned (and not yet locked)
  const allAssigned = blankIndices.every(
    (idx) => locked.has(idx) || assignments[idx] !== undefined && assignments[idx] !== null,
  );
  const allDone = blankIndices.every((idx) => locked.has(idx));

  useEffect(() => {
    if (!allAssigned || allDone) return;
    // Small delay so user sees the placement before the check fires
    const t = setTimeout(() => {
      const newResults: Record<number, BlankResult> = {};
      const newLocked = new Set(locked);
      let anyWrong = false;

      blankIndices.forEach((idx) => {
        if (locked.has(idx)) return;
        const tile = tiles.find((t) => t.key === assignments[idx]);
        if (tile && tile.midi === correctMidi(idx)) {
          newResults[idx] = 'correct';
          newLocked.add(idx);
        } else {
          newResults[idx] = 'wrong';
          anyWrong = true;
        }
      });

      setResults(newResults);
      setLocked(newLocked);

      if (anyWrong) {
        setHadWrong(true);
        // Remove wrong tiles from blanks after a short visual pause
        setTimeout(() => {
          setAssignments((prev) => {
            const next = { ...prev };
            blankIndices.forEach((idx) => {
              if (newResults[idx] === 'wrong') next[idx] = null;
            });
            return next;
          });
          setResults((prev) => {
            const next = { ...prev };
            blankIndices.forEach((idx) => {
              if (newResults[idx] === 'wrong') next[idx] = null;
            });
            return next;
          });
        }, 900);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [allAssigned, allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire onComplete when all are locked
  useEffect(() => {
    if (allDone && blankIndices.length > 0) onComplete(!hadWrong);
  }, [allDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const place = useCallback((blankIdx: number, tileKey: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      // If blank already had a tile, it returns to pool automatically (just by removing it)
      next[blankIdx] = tileKey;
      return next;
    });
    setSelection(null);
  }, []);

  const unplace = useCallback((blankIdx: number) => {
    setAssignments((prev) => ({ ...prev, [blankIdx]: null }));
    setSelection(null);
  }, []);

  const tapBlank = useCallback((idx: number) => {
    if (locked.has(idx)) return;
    if (results[idx] === 'wrong') return; // currently flashing

    if (selection?.type === 'tile') {
      place(idx, selection.key);
    } else if (assignments[idx]) {
      unplace(idx);
    } else {
      setSelection((prev) =>
        prev?.type === 'blank' && prev.idx === idx ? null : { type: 'blank', idx },
      );
    }
  }, [selection, assignments, locked, results, place, unplace]);

  const tapTile = useCallback((key: string) => {
    if (selection?.type === 'blank') {
      place(selection.idx, key);
    } else {
      setSelection((prev) =>
        prev?.type === 'tile' && prev.key === key ? null : { type: 'tile', key },
      );
    }
  }, [selection, place]);

  return {
    tiles,
    poolTiles,
    assignments,
    selection,
    results,
    locked,
    allDone,
    tapBlank,
    tapTile,
  };
}
