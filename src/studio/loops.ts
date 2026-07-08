/**
 * Studio loops — short musical material rendered with OfflineAudioContext at
 * load time. No hosted samples: drum hits, loops, stems and the synth-bass
 * line are fully synthesized, normalized, cached, and loop cleanly
 * (2 s = 4 beats @ 120 BPM).
 */

const SR = 44100;
const LEN = 2; // seconds

// ─── Offline render helper ───────────────────────────────────────────────────

async function renderOffline(
  seconds: number,
  build: (o: OfflineAudioContext) => void,
): Promise<AudioBuffer> {
  const o = new OfflineAudioContext(1, Math.ceil(SR * seconds), SR);
  build(o);
  return normalize(await o.startRendering(), 0.5);
}

// ─── Drum hit builders (shared by loops, stems, one-shots) ──────────────────

function buildKick(o: OfflineAudioContext, t: number): void {
  const osc = o.createOscillator();
  const g = o.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(g); g.connect(o.destination);
  osc.start(t); osc.stop(t + 0.32);
}

function noiseBurst(
  o: OfflineAudioContext, t: number, dur: number, filter: BiquadFilterNode, level: number,
): void {
  const buf = o.createBuffer(1, Math.ceil(SR * dur), SR);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = o.createBufferSource();
  src.buffer = buf;
  const g = o.createGain();
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter); filter.connect(g); g.connect(o.destination);
  src.start(t);
}

function buildSnare(o: OfflineAudioContext, t: number): void {
  const bp = o.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.9;
  noiseBurst(o, t, 0.18, bp, 0.7);
  const osc = o.createOscillator();
  const g = o.createGain();
  osc.type = 'triangle'; osc.frequency.value = 190;
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  osc.connect(g); g.connect(o.destination);
  osc.start(t); osc.stop(t + 0.12);
}

function buildHat(o: OfflineAudioContext, t: number): void {
  const hp = o.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 7500;
  noiseBurst(o, t, 0.05, hp, 0.3);
}

function buildClap(o: OfflineAudioContext, t: number): void {
  // three fast bursts through a bandpass — classic clap
  for (const dt of [0, 0.012, 0.026]) {
    const bp = o.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 1.5;
    noiseBurst(o, t + dt, 0.12, bp, 0.55);
  }
}

function buildBassNote(o: OfflineAudioContext, t: number, hz: number): void {
  const osc = o.createOscillator();
  const osc2 = o.createOscillator();
  const lp = o.createBiquadFilter();
  const g = o.createGain();
  osc.type = 'sawtooth'; osc.frequency.value = hz;
  osc2.type = 'sawtooth'; osc2.frequency.value = hz * 2.003; // octave shimmer
  lp.type = 'lowpass'; lp.Q.value = 4;
  lp.frequency.setValueAtTime(2200, t);
  lp.frequency.exponentialRampToValueAtTime(500, t + 0.4);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.55, t + 0.015);
  g.gain.setValueAtTime(0.55, t + 0.32);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.46);
  osc.connect(lp); osc2.connect(lp); lp.connect(g); g.connect(o.destination);
  osc.start(t); osc.stop(t + 0.5);
  osc2.start(t); osc2.stop(t + 0.5);
}

const BASS_NOTES: [number, number][] = [[0, 110], [0.5, 110], [1, 138.59], [1.5, 164.81]];

// ─── Full loops ──────────────────────────────────────────────────────────────

let drumP: Promise<AudioBuffer> | null = null;
let synthP: Promise<AudioBuffer> | null = null;

export function drumLoop(): Promise<AudioBuffer> {
  if (!drumP) {
    drumP = renderOffline(LEN, (o) => {
      buildKick(o, 0); buildKick(o, 1);
      buildSnare(o, 0.5); buildSnare(o, 1.5);
      for (let i = 0; i < 8; i++) buildHat(o, i * 0.25);
    });
  }
  return drumP;
}

export function synthLoop(): Promise<AudioBuffer> {
  if (!synthP) {
    synthP = renderOffline(LEN, (o) => {
      for (const [t, hz] of BASS_NOTES) buildBassNote(o, t, hz);
    });
  }
  return synthP;
}

let mixP: Promise<AudioBuffer> | null = null;

/** Drums + bass together — the third stage flavor. */
export function mixLoop(): Promise<AudioBuffer> {
  if (!mixP) {
    mixP = renderOffline(LEN, (o) => {
      buildKick(o, 0); buildKick(o, 1);
      buildSnare(o, 0.5); buildSnare(o, 1.5);
      for (let i = 0; i < 8; i++) buildHat(o, i * 0.25);
      for (const [t, hz] of BASS_NOTES) buildBassNote(o, t, hz);
    });
  }
  return mixP;
}

/**
 * Per-stage source rotation for the loop-based games: the beat/instrument
 * changes every stage (drums → synth bass → full mix → …).
 */
export function stageLoop(stage: number): Promise<AudioBuffer> {
  const pick = [drumLoop, synthLoop, mixLoop][(stage - 1) % 3];
  return pick();
}

// ─── Extra instrument builders (Mix Balance stem sets) ──────────────────────

/** Sustained detuned-saw pad chord through a slow lowpass. */
function buildPad(o: OfflineAudioContext, rootHz: number, minor: boolean): void {
  const intervals = [1, minor ? 1.1892 : 1.2599, 1.4983]; // root, 3rd, 5th
  for (const iv of intervals) {
    for (const det of [0.996, 1.004]) {
      const osc = o.createOscillator();
      const lp = o.createBiquadFilter();
      const g = o.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = rootHz * iv * det;
      lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.5;
      g.gain.setValueAtTime(0.0001, 0);
      g.gain.exponentialRampToValueAtTime(0.18, 0.5);
      g.gain.setValueAtTime(0.18, LEN - 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, LEN);
      osc.connect(lp); lp.connect(g); g.connect(o.destination);
      osc.start(0); osc.stop(LEN);
    }
  }
}

/** Square-wave lead melody, eighth notes. */
function buildLead(o: OfflineAudioContext, notes: number[]): void {
  notes.forEach((hz, i) => {
    if (hz <= 0) return;
    const t = i * 0.25;
    const osc = o.createOscillator();
    const g = o.createGain();
    osc.type = 'square';
    osc.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g); g.connect(o.destination);
    osc.start(t); osc.stop(t + 0.24);
  });
}

/** Resonant band-pass noise sweep (riser FX). */
function buildFxSweep(o: OfflineAudioContext): void {
  const buf = o.createBuffer(1, Math.ceil(SR * LEN), SR);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = o.createBufferSource();
  src.buffer = buf;
  const bp = o.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 6;
  bp.frequency.setValueAtTime(300, 0);
  bp.frequency.exponentialRampToValueAtTime(5000, LEN);
  const g = o.createGain();
  g.gain.setValueAtTime(0.05, 0);
  g.gain.exponentialRampToValueAtTime(0.4, LEN - 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, LEN);
  src.connect(bp); bp.connect(g); g.connect(o.destination);
  src.start(0);
}

/** Short plucky saw arp, sixteenth grid. */
function buildPluck(o: OfflineAudioContext, notes: number[]): void {
  notes.forEach((hz, i) => {
    if (hz <= 0) return;
    const t = i * 0.125;
    const osc = o.createOscillator();
    const lp = o.createBiquadFilter();
    const g = o.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = hz;
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(3500, t);
    lp.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(lp); lp.connect(g); g.connect(o.destination);
    osc.start(t); osc.stop(t + 0.14);
  });
}

/** Sub bass: sine fundamental + quiet 2nd partial for small speakers. */
function buildSubNote(o: OfflineAudioContext, t: number, hz: number, dur: number): void {
  for (const [mult, lvl] of [[1, 0.8], [2, 0.2]] as const) {
    const osc = o.createOscillator();
    const g = o.createGain();
    osc.type = 'sine';
    osc.frequency.value = hz * mult;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(lvl, t + 0.02);
    g.gain.setValueAtTime(lvl, t + dur - 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(o.destination);
    osc.start(t); osc.stop(t + dur + 0.02);
  }
}

// ─── Stem sets (Mix Balance) — different instruments & songs per level ──────

export interface StemSetDef {
  names: [string, string, string, string];
  load: () => Promise<AudioBuffer[]>;
}

const setCache: Record<number, Promise<AudioBuffer[]>> = {};

// Song 1 — A minor groove, bass one octave down (A1)
const SONG1_BASS: [number, number][] = [[0, 55], [0.5, 55], [1, 69.3], [1.5, 82.41]];
// Song 2 — D minor band tune
const SONG2_BASS: [number, number][] = [[0, 73.42], [0.5, 73.42], [1, 87.31], [1.5, 65.41]];
const SONG2_LEAD = [293.66, 349.23, 440, 392, 349.23, 329.63, 349.23, 293.66]; // D F A G F E F D
// Song 3 — E minor electro
const SONG3_PLUCK = [164.81, 0, 196, 164.81, 246.94, 0, 196, 164.81, 329.63, 0, 246.94, 196, 164.81, 0, 196, 246.94];

const STEM_SETS: StemSetDef[] = [
  {
    names: ['Kick', 'Snare', 'Hats', 'Bass'],
    load: () => Promise.all([
      renderOffline(LEN, (o) => { buildKick(o, 0); buildKick(o, 1); }),
      renderOffline(LEN, (o) => { buildSnare(o, 0.5); buildSnare(o, 1.5); }),
      renderOffline(LEN, (o) => { for (let i = 0; i < 8; i++) buildHat(o, i * 0.25); }),
      renderOffline(LEN, (o) => { for (const [t, hz] of SONG1_BASS) buildBassNote(o, t, hz); }),
    ]),
  },
  {
    names: ['Drums', 'Bass', 'Pad', 'Lead'],
    load: () => Promise.all([
      renderOffline(LEN, (o) => {
        buildKick(o, 0); buildKick(o, 1);
        buildSnare(o, 0.5); buildSnare(o, 1.5);
        for (let i = 0; i < 8; i++) buildHat(o, i * 0.25);
      }),
      renderOffline(LEN, (o) => { for (const [t, hz] of SONG2_BASS) buildBassNote(o, t, hz); }),
      renderOffline(LEN, (o) => buildPad(o, 146.83, true)), // D minor pad
      renderOffline(LEN, (o) => buildLead(o, SONG2_LEAD)),
    ]),
  },
  {
    names: ['Kick', 'Sub', 'FX', 'Pluck'],
    load: () => Promise.all([
      renderOffline(LEN, (o) => { for (const t of [0, 0.5, 1, 1.5]) buildKick(o, t); }), // 4-floor
      renderOffline(LEN, (o) => { buildSubNote(o, 0, 41.2, 0.95); buildSubNote(o, 1, 49, 0.95); }), // E1→G1
      renderOffline(LEN, (o) => buildFxSweep(o)),
      renderOffline(LEN, (o) => buildPluck(o, SONG3_PLUCK)),
    ]),
  },
];

export function stemSetForLevel(level: number): number {
  return level <= 2 ? 0 : level <= 5 ? 1 : 2;
}

export function stemSetNames(setIdx: number): [string, string, string, string] {
  return STEM_SETS[setIdx].names;
}

export function stemLoops(setIdx = 0): Promise<AudioBuffer[]> {
  if (!setCache[setIdx]) setCache[setIdx] = STEM_SETS[setIdx].load();
  return setCache[setIdx];
}

// ─── One-shot hits (Beat Copy sequencer) ─────────────────────────────────────

export type DrumHit = 'kick' | 'snare' | 'hat' | 'clap';

let hitsP: Promise<Record<DrumHit, AudioBuffer>> | null = null;

export function drumHits(): Promise<Record<DrumHit, AudioBuffer>> {
  if (!hitsP) {
    hitsP = (async () => ({
      kick: await renderOffline(0.35, (o) => buildKick(o, 0)),
      snare: await renderOffline(0.25, (o) => buildSnare(o, 0)),
      hat: await renderOffline(0.08, (o) => buildHat(o, 0)),
      clap: await renderOffline(0.3, (o) => buildClap(o, 0)),
    }))();
  }
  return hitsP;
}

// ─── Stereo decorrelated pink noise (for width games) ───────────────────────

let stereoPinkP: AudioBuffer | null = null;

export function stereoPinkBuffer(ctx: BaseAudioContext): AudioBuffer {
  if (stereoPinkP) return stereoPinkP;
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.25;
    }
  }
  stereoPinkP = buf;
  return buf;
}

function normalize(buf: AudioBuffer, peak: number): AudioBuffer {
  let max = 0;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < d.length; i++) max = Math.max(max, Math.abs(d[i]));
  }
  if (max > 0) {
    const k = peak / max;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] *= k;
    }
  }
  return buf;
}
