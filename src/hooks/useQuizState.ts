import { useCallback, useRef, useState } from 'react';
import type { Exercise, Question } from '../exercises/types';
import type { InstrumentId } from '../audio/engine';
import { playCadence } from '../audio/cadence';
import { keyToOffset } from '../audio/theory';

export interface Feedback {
  ok: boolean;
  guess: string | number;
}

export interface QuizSession<TPayload = unknown> {
  exercise: Exercise<TPayload>;
  question: (Question & { payload: TPayload; pickId: string | number }) | null;
  feedback: Feedback | null;
  // metrics
  correct: number;
  total: number;
  streak: number;
  best: number;
  answered: boolean;  // user has locked in an answer for current question
}

export interface UseQuizStateOptions {
  exercise: Exercise<unknown>;
  levelIndex: number;
  keyName: string;
  direction: 'asc' | 'desc';
  cadenceEnabled: boolean;
  instrument: InstrumentId;
}

export function useQuizState(opts: UseQuizStateOptions) {
  const [session, setSession] = useState<QuizSession>({
    exercise: opts.exercise,
    question: null,
    feedback: null,
    correct: 0,
    total: 0,
    streak: 0,
    best: 0,
    answered: false,
  });
  const historyRef = useRef<Array<string | number>>([]);

  // When the exercise itself changes (phase swap), reset question + history
  // but keep score (the user may want to continue scoring across phases).
  // v1 behavior: score is per-session, so we keep it.
  if (session.exercise.id !== opts.exercise.id) {
    historyRef.current = [];
    setSession((s) => ({ ...s, exercise: opts.exercise, question: null, feedback: null, answered: false }));
  }

  const nextQuestion = useCallback(() => {
    const keyOffset = keyToOffset(opts.keyName);
    const q = opts.exercise.generate({
      levelIndex: opts.levelIndex,
      keyOffset,
      direction: opts.direction,
      recentPicks: historyRef.current,
    });
    historyRef.current.push(q.pickId);
    if (historyRef.current.length > 10) historyRef.current.shift();

    setSession((s) => ({ ...s, question: q, feedback: null, answered: false }));

    // Play cadence first (if enabled), then the question
    playCadence(60 + keyOffset, opts.instrument, opts.cadenceEnabled, () => {
      opts.exercise.play(q, opts.instrument);
    });
  }, [opts.exercise, opts.levelIndex, opts.keyName, opts.direction, opts.cadenceEnabled, opts.instrument]);

  const replay = useCallback(() => {
    if (!session.question) return;
    opts.exercise.play(session.question, opts.instrument);
  }, [session.question, opts.exercise, opts.instrument]);

  const answer = useCallback(
    (guess: string | number) => {
      setSession((s) => {
        if (s.answered || !s.question) return s;
        const ok = opts.exercise.isCorrect(s.question, guess);
        const newCorrect = s.correct + (ok ? 1 : 0);
        const newStreak = ok ? s.streak + 1 : 0;
        return {
          ...s,
          feedback: { ok, guess },
          answered: true,
          total: s.total + 1,
          correct: newCorrect,
          streak: newStreak,
          best: Math.max(s.best, newStreak),
        };
      });
    },
    [opts.exercise]
  );

  const resetScore = useCallback(() => {
    setSession((s) => ({ ...s, correct: 0, total: 0, streak: 0, best: 0 }));
  }, []);

  const resetQuestion = useCallback(() => {
    historyRef.current = [];
    setSession((s) => ({ ...s, question: null, feedback: null, answered: false }));
  }, []);

  return { session, nextQuestion, replay, answer, resetScore, resetQuestion };
}
