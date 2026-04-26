import type { InstrumentId } from '../audio/engine';

/**
 * A Question is whatever the current quiz round expects the user to answer.
 * Exercises generate questions and render answer buttons for them.
 */
export interface Question {
  /** MIDI numbers of the notes that should be highlighted on piano/fretboard. */
  notes: number[];
  /** Root note MIDI — always highlighted in the primary accent color. */
  root: number;
  /** Opaque discriminator — whatever shape the exercise needs to check answers. */
  payload: unknown;
}

/** One option shown in the answer grid. */
export interface AnswerOption {
  /** Stable identifier returned when the user taps this option. */
  id: string | number;
  /** Primary label, e.g. "Major 3rd". */
  label: string;
  /** Compact label shown above the primary (e.g. "M3"). */
  short: string;
  /** CSS color used for the "correct" highlight state. */
  color: string;
  /** Optional third line, e.g. "4st" or "M3 + m3". */
  hint?: string;
}

/** Feedback displayed after the user answers. */
export interface FeedbackInfo {
  label: string;   // what the correct answer actually was
  color: string;   // accent color
  reference?: string;   // song mnemonic / example
  altReference?: string;
}

/**
 * An Exercise is a plug-in lesson type. The registry lists them and the
 * training page wires up whichever one is selected.
 */
export interface Exercise<TPayload = unknown> {
  id: string;
  name: string;

  /** Level presets (Beginner → Expert). */
  levels: ReadonlyArray<{ n: string }>;

  /** Should the Asc/Desc direction selector be visible for this exercise? */
  usesDirection: boolean;

  /** Generate a fresh question given the current settings. */
  generate(opts: {
    levelIndex: number;
    keyOffset: number;
    direction: 'asc' | 'desc';
    recentPicks: Array<string | number>;
  }): Question & { payload: TPayload; pickId: string | number };

  /** Play the question (e.g. two notes for intervals, arpeggio+chord for triads). */
  play(q: Question & { payload: TPayload }, instId: InstrumentId): void;

  /** Build the answer buttons for the current level. */
  answers(levelIndex: number): AnswerOption[];

  /** Check whether the user's choice is correct. */
  isCorrect(q: Question & { payload: TPayload }, guess: string | number): boolean;

  /** Look up feedback info for a given answer id. */
  feedback(answerId: string | number): FeedbackInfo;
}
