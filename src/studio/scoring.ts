/**
 * Studio scoring — accuracy-based points, verified numerically
 * (see working agreement: all math checked with a throwaway script).
 *
 * Model:
 * - Each stage answer gets an accuracy in [0,1].
 * - Points = round(maxPoints × accuracy), plus a small speed bonus.
 * - accuracy < MISS_THRESHOLD ⇒ counted as a miss (red flash/ping) — the
 *   run always continues; there are no lives.
 */

import { strictnessFactor } from './settings';

export const MISS_THRESHOLD = 0.35;
export const MAX_POINTS = 100;
export const SPEED_BONUS = 5;
export const SPEED_BONUS_SECS = 5;

/**
 * Accuracy for frequency guesses: linear in octave distance.
 * d = |log2(guess/target)|, full credit at 0, zero credit at `zeroAtOctaves`
 * (scaled by the global strictness setting).
 */
export function freqAccuracy(guessHz: number, targetHz: number, zeroAtOctaves = 2): number {
  if (guessHz <= 0 || targetHz <= 0) return 0;
  const d = Math.abs(Math.log2(guessHz / targetHz));
  return clamp01(1 - d / (zeroAtOctaves * strictnessFactor()));
}

/**
 * Accuracy for linear scales (pan position, stereo width, dB, ms):
 * full credit at 0 distance, zero credit at `zeroAtDistance`
 * (scaled by the global strictness setting).
 */
export function linearAccuracy(guess: number, target: number, zeroAtDistance: number): number {
  const d = Math.abs(guess - target);
  return clamp01(1 - d / (zeroAtDistance * strictnessFactor()));
}

/** Points for a stage: accuracy-scaled + speed bonus. */
export function stagePoints(accuracy: number, answerSecs: number): { points: number; bonus: number } {
  const points = Math.round(MAX_POINTS * accuracy);
  const bonus = accuracy >= MISS_THRESHOLD && answerSecs <= SPEED_BONUS_SECS ? SPEED_BONUS : 0;
  return { points, bonus };
}

export function isMiss(accuracy: number): boolean {
  return accuracy < MISS_THRESHOLD;
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

// ─── Log-frequency ruler mapping (20 Hz – 20 kHz) ────────────────────────────

export const FREQ_MIN = 20;
export const FREQ_MAX = 20000;

/** Map a frequency to a 0..1 ruler position (log scale). */
export function freqToPos(hz: number): number {
  return Math.log(hz / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN);
}

/** Map a 0..1 ruler position back to frequency (log scale). */
export function posToFreq(pos: number): number {
  return FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, Math.min(1, Math.max(0, pos)));
}

/** Human label for a frequency: "365 Hz", "6.3 kHz". */
export function fmtFreq(hz: number): string {
  if (hz >= 1000) {
    const k = hz / 1000;
    return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10} kHz`;
  }
  return `${Math.round(hz)} Hz`;
}

/** Human label for pan: "0.35 L", "C", "0.72 R". */
export function fmtPan(p: number): string {
  const a = Math.round(Math.abs(p) * 100) / 100;
  if (a < 0.005) return 'C';
  return `${a} ${p < 0 ? 'L' : 'R'}`;
}
