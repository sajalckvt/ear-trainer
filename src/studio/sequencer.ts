/**
 * StepSequencer — 16-step lookahead scheduler for Beat Copy.
 * Standard WebAudio pattern: a 25 ms timer schedules hits ~120 ms ahead on
 * the audio clock, so playback is sample-accurate regardless of UI jank.
 */

import { ensureCtx } from '../audio/engine';

export const STEPS = 16;

export class StepSequencer {
  private ctx: AudioContext;
  private master: GainNode;
  private buffers: AudioBuffer[];      // one per lane
  private timer: ReturnType<typeof setInterval> | null = null;
  private uiTimeouts: ReturnType<typeof setTimeout>[] = [];
  private nextTime = 0;
  private step = 0;

  /** [lane][step] — mutate freely; picked up on the fly. */
  pattern: boolean[][];
  bpm = 100;
  /** UI callback, fired when a step is scheduled (slightly ahead of audio). */
  onStep: ((step: number) => void) | null = null;

  constructor(laneBuffers: AudioBuffer[], level = 0.35) {
    this.ctx = ensureCtx();
    this.buffers = laneBuffers;
    this.master = this.ctx.createGain();
    this.master.gain.value = level;
    this.master.connect(this.ctx.destination);
    this.pattern = laneBuffers.map(() => Array(STEPS).fill(false) as boolean[]);
  }

  private stepDur(): number {
    return 60 / this.bpm / 4; // 16ths
  }

  get playing(): boolean {
    return this.timer !== null;
  }

  start(): void {
    this.stopTimer();
    this.nextTime = this.ctx.currentTime + 0.06;
    this.step = 0;
    this.timer = setInterval(() => this.tick(), 25);
  }

  private tick(): void {
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      for (let lane = 0; lane < this.pattern.length; lane++) {
        if (this.pattern[lane][this.step] && this.buffers[lane]) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.buffers[lane];
          src.connect(this.master);
          src.start(this.nextTime);
        }
      }
      // Fire the UI callback when the step actually SOUNDS, not when it is
      // scheduled (scheduling runs up to ~120 ms ahead and in bursts, which
      // made the playhead jump across columns).
      const s = this.step;
      const delayMs = Math.max(0, (this.nextTime - this.ctx.currentTime) * 1000);
      this.uiTimeouts.push(setTimeout(() => this.onStep?.(s), delayMs));
      if (this.uiTimeouts.length > 64) this.uiTimeouts.splice(0, 32); // prune fired ids
      this.nextTime += this.stepDur();
      this.step = (this.step + 1) % STEPS;
    }
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    for (const t of this.uiTimeouts) clearTimeout(t);
    this.uiTimeouts = [];
  }

  stop(): void {
    this.stopTimer();
    this.onStep?.(-1);
  }

  dispose(): void {
    this.stopTimer();
    this.master.disconnect();
  }
}
