/**
 * Studio audio core — WebAudio engine for the SoundGym-style production games.
 *
 * Design:
 * - One looping source feeds two parallel chains (A = "question"/processed,
 *   B = "original"/user). A/B switching is a short equal-power gain crossfade,
 *   so the loop never restarts and there are no clicks.
 * - Noise sources are generated buffers (white / pink) — no hosted samples.
 * - UI feedback pings (correct / wrong) are synthesized oscillator blips.
 *
 * Reuses the app-wide AudioContext helpers from audio/engine.
 */

import { ensureCtx } from '../audio/engine';

// ─── Noise buffers ───────────────────────────────────────────────────────────

const noiseCache: Record<string, AudioBuffer> = {};

/** 2-second looping white-noise buffer. */
export function whiteNoiseBuffer(): AudioBuffer {
  const ctx = ensureCtx();
  if (noiseCache.white) return noiseCache.white;
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  noiseCache.white = buf;
  return buf;
}

/**
 * 2-second looping pink-noise buffer (Paul Kellet's economy filter).
 * Pink noise has equal energy per octave — the standard stimulus for
 * frequency-recognition training.
 */
export function pinkNoiseBuffer(): AudioBuffer {
  const ctx = ensureCtx();
  if (noiseCache.pink) return noiseCache.pink;
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + w * 0.099046;
    b1 = 0.963 * b1 + w * 0.2965164;
    b2 = 0.57 * b2 + w * 1.0526913;
    d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.25;
  }
  noiseCache.pink = buf;
  return buf;
}

// ─── A/B loop player ─────────────────────────────────────────────────────────

const XFADE = 0.03; // 30 ms equal-power crossfade — click-free, feels instant

export interface ChainHandle {
  /** First node of the chain — connect processing after it. */
  input: GainNode;
  /** Terminal node — already connected to the master output. */
  output: GainNode;
}

/**
 * A looping source feeding N parallel chains, only one audible at a time.
 * `select(i)` crossfades between chains without restarting the loop.
 */
export class ABLoopPlayer {
  private ctx: AudioContext;
  private src: AudioBufferSourceNode | null = null;
  private multiSrcs: AudioBufferSourceNode[] = [];
  private master: GainNode;
  private chains: { pre: GainNode; post: GainNode }[] = [];
  private active = 0;
  private started = false;

  constructor(chainCount: number, masterLevel = 0.22) {
    this.ctx = ensureCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = masterLevel;
    this.master.connect(this.ctx.destination);
    for (let i = 0; i < chainCount; i++) {
      const pre = this.ctx.createGain();  // chain input (post-source tap)
      const post = this.ctx.createGain(); // chain audibility gate
      post.gain.value = i === 0 ? 1 : 0;
      post.connect(this.master);
      this.chains.push({ pre, post });
    }
  }

  /** Chain i: build processing between .input and .output (default: wire). */
  chain(i: number): ChainHandle {
    return { input: this.chains[i].pre, output: this.chains[i].post };
  }

  /** Directly wire chain i input→output (no processing). */
  passthrough(i: number): void {
    this.chains[i].pre.connect(this.chains[i].post);
  }

  private buffer: AudioBuffer | null = null;

  start(buffer: AudioBuffer): void {
    if (this.started) return;
    this.setBuffer(buffer);
  }

  /**
   * Swap the looping source to a new buffer (per-stage beat/instrument
   * rotation). Restarts the loop from the top; also used by `restart()`.
   */
  setBuffer(buffer: AudioBuffer): void {
    if (this.src) {
      try { this.src.stop(); } catch { /* already stopped */ }
      this.src.disconnect();
    }
    this.buffer = buffer;
    this.src = this.ctx.createBufferSource();
    this.src.buffer = buffer;
    this.src.loop = true;
    for (const c of this.chains) this.src.connect(c.pre);
    this.src.start();
    this.started = true;
  }

  /** Replay the current loop from the beginning (the 🔁 transport button). */
  restart(): void {
    if (this.buffer) this.setBuffer(this.buffer);
  }

  /**
   * Start N looping sources in sample-sync (multi-stem games). The sources
   * are NOT connected to the chains — the game wires each through its own
   * per-stem gains into chain inputs.
   */
  startSources(buffers: AudioBuffer[]): AudioBufferSourceNode[] {
    if (this.started) return [];
    const t = this.ctx.currentTime + 0.05;
    this.multiSrcs = buffers.map((b) => {
      const s = this.ctx.createBufferSource();
      s.buffer = b;
      s.loop = true;
      s.start(t);
      return s;
    });
    this.started = true;
    return this.multiSrcs;
  }

  /** Mark started without a buffer source (live-synth games own their voices). */
  startSilent(): void {
    this.started = true;
  }

  get activeChain(): number {
    return this.active;
  }

  /** Equal-power crossfade to chain i. */
  select(i: number): void {
    if (i === this.active) return;
    const t = this.ctx.currentTime;
    for (let c = 0; c < this.chains.length; c++) {
      const g = this.chains[c].post.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(c === i ? 1 : 0, t + XFADE);
    }
    this.active = i;
  }

  stop(): void {
    if (this.src) {
      try { this.src.stop(); } catch { /* already stopped */ }
      this.src.disconnect();
      this.src = null;
    }
    for (const s of this.multiSrcs) {
      try { s.stop(); } catch { /* already stopped */ }
      s.disconnect();
    }
    this.multiSrcs = [];
    this.master.disconnect();
    this.started = false;
  }
}

// ─── Feedback pings ──────────────────────────────────────────────────────────

function blip(freqs: [number, number], type: OscillatorType, dur: number): void {
  const ctx = ensureCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqs[0], t);
  osc.frequency.exponentialRampToValueAtTime(freqs[1], t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.1, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Bright ascending ping — correct answer. */
export function pingCorrect(): void {
  blip([880, 1760], 'sine', 0.18);
}

/** Low descending buzz — wrong answer. */
export function pingWrong(): void {
  blip([220, 110], 'square', 0.25);
}

// ─── Reverb impulse response ─────────────────────────────────────────────────

/**
 * Synthetic stereo impulse response: decorrelated noise with an exponential
 * decay tail. `seconds` sets the audible decay length.
 */
export function makeImpulse(seconds: number): AudioBuffer {
  const ctx = ensureCtx();
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp((-3 * i) / len);
    }
  }
  return buf;
}
