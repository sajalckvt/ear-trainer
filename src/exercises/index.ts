import { intervalExercise } from './interval';
import { triadExercise } from './triad';
import type { Exercise } from './types';

/**
 * All registered exercises. To add a new exercise type, implement the
 * Exercise interface in a new file under src/exercises/ and append it here.
 */
export const EXERCISES: ReadonlyArray<Exercise<unknown>> = [
  intervalExercise as unknown as Exercise<unknown>,
  triadExercise as unknown as Exercise<unknown>,
];
