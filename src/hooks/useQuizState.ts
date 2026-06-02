import { useCallback, useRef, useState } from 'react';
import type { Exercise, Question } from '../exercises/types';
import type { InstrumentId } from '../audio/engine';
import { playCadence } from '../audio/cadence';
import { keyToOffset } from '../audio/theory';

/** Three phases of a single question */
export type QuizPhase =
  | 'idle'        // no question yet
  | 'playing'     // awaiting first answer
  | 'close_miss'  // first guess was close — retry available, score already penalised
  | 'answered';   // final state — correct or wrong, show full feedback

export interface Feedback {
  ok: boolean;
  guess: string | number;
  phase: QuizPhase;
}

export interface QuizSession<TPayload = unknown> {
  exercise: Exercise<TPayload>;
  question: (Question & { payload: TPayload; pickId: string | number }) | null;
  feedback: Feedback | null;
  quizPhase: QuizPhase;
  correct: number;
  total: number;
  streak: number;
  best: number;
  nearMisses: number;
}

export interface UseQuizStateOptions {
  exercise: Exercise<unknown>;
  levelIndex: number;
  keyName: string;
  direction: 'asc' | 'desc';
  distanceDirection: 'asc' | 'desc' | 'both';
  cadenceEnabled: boolean;
  spread: boolean;
  arpeggio: boolean;
  humanize: boolean;
  /** base velocity from the manual dynamics control (0..1) */
  dynamics: number;
  modeChordCount: number;
  instrument: InstrumentId;
  progressionLength?: number;
  intervalMode?: 'anchored' | 'free';
}

export function useQuizState(opts: UseQuizStateOptions) {
  const [session, setSession] = useState<QuizSession>({
    exercise: opts.exercise,
    question: null,
    feedback: null,
    quizPhase: 'idle',
    correct: 0,
    total: 0,
    streak: 0,
    best: 0,
    nearMisses: 0,
  });
  const historyRef = useRef<Array<string | number>>([]);

  if (session.exercise.id !== opts.exercise.id) {
    historyRef.current = [];
    setSession((s) => ({
      ...s,
      exercise: opts.exercise,
      question: null,
      feedback: null,
      quizPhase: 'idle',
    }));
  }

  const nextQuestion = useCallback(() => {
    const keyOffset = keyToOffset(opts.keyName);
    const q = opts.exercise.generate({
      levelIndex: opts.levelIndex,
      keyOffset,
      direction: opts.direction,
      recentPicks: historyRef.current,
      spread: opts.spread,
      distanceDirection: opts.distanceDirection,
      modeChordCount: opts.modeChordCount,
      progressionLength: opts.progressionLength,
      intervalMode: opts.intervalMode,
    });
    historyRef.current.push(q.pickId);
    if (historyRef.current.length > 10) historyRef.current.shift();

    const silent = opts.exercise.silentStart === true;
    // Silent-start still uses 'playing' (so answers are accepted) but plays
    // no audio — the chord is heard only on reveal via feedback.demoPlay.
    setSession((s) => ({ ...s, question: q, feedback: null, quizPhase: 'playing' }));

    if (!silent) {
      playCadence(60 + keyOffset, opts.instrument, opts.cadenceEnabled, () => {
        opts.exercise.play(q, opts.instrument, { arpeggio: opts.arpeggio, humanize: opts.humanize, dynamics: opts.dynamics });
      });
    }
  }, [opts.exercise, opts.levelIndex, opts.keyName, opts.direction, opts.distanceDirection, opts.cadenceEnabled, opts.spread, opts.arpeggio, opts.humanize, opts.dynamics, opts.modeChordCount, opts.progressionLength, opts.instrument, opts.intervalMode]);

  const replay = useCallback(() => {
    if (!session.question) return;
    // Silent-start exercises must not reveal the chord before answering.
    if (opts.exercise.silentStart && !session.feedback) return;
    opts.exercise.play(session.question, opts.instrument, { arpeggio: opts.arpeggio, humanize: opts.humanize, dynamics: opts.dynamics });
  }, [session.question, session.feedback, opts.exercise, opts.instrument, opts.arpeggio, opts.humanize, opts.dynamics]);

  const answer = useCallback(
    (guess: string | number) => {
      setSession((s) => {
        if (s.quizPhase === 'answered' || s.quizPhase === 'idle' || !s.question) return s;

        const ok = opts.exercise.isCorrect(s.question, guess);

        // If already in close_miss phase — this is the retry, just resolve
        if (s.quizPhase === 'close_miss') {
          const newStreak = ok ? s.streak + 1 : 0;
          return {
            ...s,
            feedback: { ok, guess, phase: 'answered' },
            quizPhase: 'answered',
            // Score was already counted on first guess — don't double-count
            streak: newStreak,
            best: Math.max(s.best, newStreak),
          };
        }

        // First guess
        if (ok) {
          const newStreak = s.streak + 1;
          return {
            ...s,
            feedback: { ok: true, guess, phase: 'answered' },
            quizPhase: 'answered',
            total: s.total + 1,
            correct: s.correct + 1,
            streak: newStreak,
            best: Math.max(s.best, newStreak),
          };
        }

        // Wrong — check if close
        const close = opts.exercise.isClose?.(s.question, guess) ?? false;
        if (close) {
          return {
            ...s,
            feedback: { ok: false, guess, phase: 'close_miss' },
            quizPhase: 'close_miss',
            total: s.total + 1,    // counts as wrong immediately
            streak: 0,
            nearMisses: s.nearMisses + 1,
          };
        }

        // Wrong + not close — full reveal
        return {
          ...s,
          feedback: { ok: false, guess, phase: 'answered' },
          quizPhase: 'answered',
          total: s.total + 1,
          streak: 0,
        };
      });
    },
    [opts.exercise]
  );

  const resetScore = useCallback(() => {
    setSession((s) => ({ ...s, correct: 0, total: 0, streak: 0, best: 0, nearMisses: 0 }));
  }, []);

  const resetQuestion = useCallback(() => {
    historyRef.current = [];
    setSession((s) => ({ ...s, question: null, feedback: null, quizPhase: 'idle' }));
  }, []);

  return { session, nextQuestion, replay, answer, resetScore, resetQuestion };
}
