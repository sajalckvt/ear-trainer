/**
 * useStageGame — shared state machine for studio games.
 *
 * intro → playing → reveal → (playing … ) → complete
 *
 * The game supplies an accuracy per answer; the hook handles points, speed
 * bonus, miss feedback (red flash/ping — no lives, the run always continues),
 * pings, and progress persistence.
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { isMiss, stagePoints } from './scoring';
import { pingCorrect, pingWrong, type ABLoopPlayer } from './audioCore';
import { recordRun } from './progress';

export type GamePhase = 'intro' | 'playing' | 'reveal' | 'complete';

export interface StageResult {
  accuracy: number;
  points: number;
  bonus: number;
  missed: boolean;
}

export interface StageGame {
  phase: GamePhase;
  stage: number;       // 1-based
  stages: number;
  score: number;
  lastResult: StageResult | null;
  start: () => void;
  submit: (accuracy: number) => StageResult;
  next: () => void;
  restart: () => void;
}

export function useStageGame(opts: {
  gameId: string;
  level: number;
  stages: number;
  /** Called when a new stage begins (generate the next question here). */
  onStage: (stage: number) => void;
}): StageGame {
  const { gameId, level, stages, onStage } = opts;

  const [phase, setPhase] = useState<GamePhase>('intro');
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const [lastResult, setLastResult] = useState<StageResult | null>(null);
  const stageStartRef = useRef(0);

  const beginStage = useCallback((s: number) => {
    setStage(s);
    stageStartRef.current = performance.now();
    onStage(s);
    setPhase('playing');
  }, [onStage]);

  const start = useCallback(() => {
    setScore(0);
    setLastResult(null);
    beginStage(1);
  }, [beginStage]);

  const submit = useCallback((accuracy: number): StageResult => {
    const secs = (performance.now() - stageStartRef.current) / 1000;
    const { points, bonus } = stagePoints(accuracy, secs);
    const missed = isMiss(accuracy);
    const result: StageResult = { accuracy, points, bonus, missed };
    setLastResult(result);
    setScore((s) => s + points + bonus);
    if (missed) pingWrong();
    else pingCorrect();
    setPhase('reveal');
    return result;
  }, []);

  const next = useCallback(() => {
    if (stage >= stages) {
      setPhase('complete');
      recordRun(gameId, { score, completedLevel: level });
      return;
    }
    beginStage(stage + 1);
  }, [stage, stages, beginStage, gameId, score, level]);

  const restart = useCallback(() => {
    setPhase('intro');
  }, []);

  return { phase, stage, stages, score, lastResult, start, submit, next, restart };
}

/**
 * Tear the game's ABLoopPlayer down whenever the run ends (or the component
 * unmounts). Every studio game uses this.
 */
export function usePlayerTeardown(
  phase: GamePhase,
  playerRef: RefObject<ABLoopPlayer | null>,
): void {
  useEffect(() => {
    if (phase === 'complete' || phase === 'intro') {
      playerRef.current?.stop();
      playerRef.current = null;
    }
  }, [phase, playerRef]);
  useEffect(
    () => () => {
      playerRef.current?.stop();
      playerRef.current = null;
    },
    [playerRef],
  );
}
