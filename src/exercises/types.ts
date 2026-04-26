import type { InstrumentId } from '../audio/engine';

export interface Question {
  notes: number[];
  root: number;
  payload: unknown;
}

export interface AnswerOption {
  id: string | number;
  label: string;
  short: string;
  color: string;
  hint?: string;
}

export interface FeedbackInfo {
  label: string;
  color: string;
  reference?: string;
  altReference?: string;
  /** Short-circuit demo — plays a canonical example of this answer when the sheet opens */
  demoPlay?: (instId: InstrumentId) => void;
}

/** Three-state result of answering */
export type AnswerResult = 'correct' | 'close' | 'wrong';

export interface Exercise<TPayload = unknown> {
  id: string;
  name: string;
  levels: ReadonlyArray<{ n: string }>;
  usesDirection: boolean;

  generate(opts: {
    levelIndex: number;
    keyOffset: number;
    direction: 'asc' | 'desc';
    recentPicks: Array<string | number>;
  }): Question & { payload: TPayload; pickId: string | number };

  play(q: Question & { payload: TPayload }, instId: InstrumentId): void;
  answers(levelIndex: number): AnswerOption[];
  isCorrect(q: Question & { payload: TPayload }, guess: string | number): boolean;

  /**
   * Close miss = "almost right" — triggers hint + retry instead of full reveal.
   * Default: false (never close, always fully reveal).
   */
  isClose?(q: Question & { payload: TPayload }, guess: string | number): boolean;

  /** Hint shown after a close miss — must NOT name the correct answer. */
  getHint?(correctId: string | number, guessId: string | number): string;

  feedback(answerId: string | number): FeedbackInfo;
}
