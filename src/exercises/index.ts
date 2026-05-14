import { intervalExercise } from './interval';
import { distanceExercise } from './distance';
import { triadExercise } from './triad';
import { progressionExercise } from './progression';
import { modeHarmonyExercise } from './modeHarmony';
import { scaleIdExercise } from './scaleId';
// melodyExercise kept in codebase but hidden from nav until redesigned
import type { Exercise } from './types';

export const EXERCISES: ReadonlyArray<Exercise<unknown>> = [
  intervalExercise     as unknown as Exercise<unknown>,
  distanceExercise     as unknown as Exercise<unknown>,
  triadExercise        as unknown as Exercise<unknown>,
  progressionExercise  as unknown as Exercise<unknown>,
  modeHarmonyExercise  as unknown as Exercise<unknown>,
  scaleIdExercise      as unknown as Exercise<unknown>,
];
