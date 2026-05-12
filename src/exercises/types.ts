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

/**
 * A song reference shown in the feedback sheet. Each ref has a title
 * (and optional one-liner hint), and an optional playable hook so the
 * user can tap to hear the actual melodic phrase from that song.
 * The phrase is played on the user's currently selected instrument,
 * transposed so the song's tonic equals the question's root.
 */
export interface SongRefPlayable {
  title: string;
  hint?: string;
  /** If defined, FeedbackSheet shows a ▶ button that calls this with the
   *  user's current instrument and the question's root MIDI value. */
  play?: (instId: InstrumentId, rootMidi: number) => void;
}

export interface FeedbackInfo {
  label: string;
  color: string;
  /** Deprecated — use songRefs. Kept for backwards-compat with exercises
   *  that haven't migrated yet (interval, distance, melody). */
  reference?: string;
  altReference?: string;
  /** New: playable song references. Preferred over reference/altReference. */
  songRefs?: SongRefPlayable[];
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
    /** If true, exercises that support it should voice chords across
     *  multiple octaves rather than in close root position. Optional —
     *  exercises that don't support it can ignore it. */
    spread?: boolean;
  }): Question & { payload: TPayload; pickId: string | number };

  play(
    q: Question & { payload: TPayload },
    instId: InstrumentId,
    opts?: { arpeggio?: boolean },
  ): void;

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
