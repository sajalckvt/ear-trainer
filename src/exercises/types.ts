import type { InstrumentId } from '../audio/engine';

export interface Question {
  notes: number[];
  root: number;
  payload: unknown;
  /** Optional label shown in PlayArea instead of "Root: X" */
  displayLabel?: string;
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
  demoPlay?: (instId: InstrumentId) => void;
}

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

  /** Static answer set for the level (used by most exercises). */
  answers(levelIndex: number): AnswerOption[];

  /**
   * Question-specific answers — overrides answers() when defined.
   * Used by melody exercise where distractors depend on the specific question.
   */
  getQuestionAnswers?(q: Question & { payload: TPayload }): AnswerOption[];

  isCorrect(q: Question & { payload: TPayload }, guess: string | number): boolean;
  isClose?(q: Question & { payload: TPayload }, guess: string | number): boolean;
  getHint?(correctId: string | number, guessId: string | number): string;
  feedback(answerId: string | number): FeedbackInfo;
}
