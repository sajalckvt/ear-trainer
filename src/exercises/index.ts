import { intervalExercise } from './interval';
import { distanceExercise } from './distance';
import { triadExercise } from './triad';
import { progressionExercise } from './progression';
import { modeHarmonyExercise } from './modeHarmony';
import { melodyExercise } from './melody';
import type { Exercise } from './types';

export const EXERCISES: ReadonlyArray<Exercise<unknown>> = [
  intervalExercise     as unknown as Exercise<unknown>,
  distanceExercise     as unknown as Exercise<unknown>,
  triadExercise        as unknown as Exercise<unknown>,
  progressionExercise  as unknown as Exercise<unknown>,
  modeHarmonyExercise  as unknown as Exercise<unknown>,
  melodyExercise       as unknown as Exercise<unknown>,
];
