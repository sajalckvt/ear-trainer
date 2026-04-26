import { intervalExercise } from './interval';
import { distanceExercise } from './distance';
import { triadExercise } from './triad';
import type { Exercise } from './types';

export const EXERCISES: ReadonlyArray<Exercise<unknown>> = [
  intervalExercise as unknown as Exercise<unknown>,
  distanceExercise as unknown as Exercise<unknown>,
  triadExercise as unknown as Exercise<unknown>,
];
