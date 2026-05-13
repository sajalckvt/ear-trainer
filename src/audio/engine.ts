/**
 * Audio engine — mobile-safe AudioContext + soundfont decoding + playback.
 *
 * Architectural notes (preserved from v1):
 * - iOS suspends AudioContext aggressively; we try to resume it on every call.
 * - Audio unlock requires a silent sound played INSIDE a user gesture. A global
 *   listener on touchstart/click/keydown ensures the context is unlocked ASAP.
 * - Samples are decoded lazily on first use and cached in BC (buffer cache).
 */

import { m2n } from './theory';

export type InstrumentId =
  | 'choir_aahs'
  | 'voice_oohs'
  | 'acoustic_grand_piano'
  | 'violin';

// Soundfont shape: { instrumentId: { noteName: dataUrl } }
type SoundfontData = Record<string, Record<string, string>>;

// ─── State ──────────────────────────────────────────────────────────────────
let ctx: AudioContext | null = null;
let soundfont: SoundfontData | null = null;
let soundfontPromise: Promise<SoundfontData> | null = null;
const BC: Record<string, AudioBuffer> = {};

// ─── Context management ────────────────────────────────────────────────────
export function ensureCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function initAudioOnGesture(): void {
  const a = ensureCtx();
  try {
    const osc = a.createOscillator();
    const g = a.createGain();
    g.gain.value = 0;
    osc.connect(g).connect(a.destination);
    osc.start(0);
    osc.stop(a.currentTime + 0.01);
  } catch {
    /* noop */
  }
}

/** Call once at app startup to wire up the iOS unlock handlers. */
export function registerAudioUnlock(): void {
  (['touchstart', 'touchend', 'click', 'keydown'] as const).forEach((evt) => {
    document.addEventListener(evt, initAudioOnGesture, { passive: true });
  });
}

// ─── Soundfont loading ─────────────────────────────────────────────────────
export function loadSoundfont(url = 'soundfont.json'): Promise<SoundfontData> {
  if (soundfont) return Promise.resolve(soundfont);
  if (soundfontPromise) return soundfontPromise;

  // Respect Vite's base URL so this works under GitHub Pages subpaths
  const base = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL;
  const resolved = url.startsWith('/') || url.startsWith('http') ? url : `${base}${url}`;

  soundfontPromise = fetch(resolved)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load soundfont: ${r.status}`);
      return r.json();
    })
    .then((data: SoundfontData) => {
      soundfont = data;
      return data;
    });
  return soundfontPromise;
}

// ─── Decode + play ────────────────────────────────────────────────────────
function decodeNote(instId: InstrumentId, note: string): Promise<AudioBuffer | null> {
  const k = `${instId}_${note}`;
  if (BC[k]) return Promise.resolve(BC[k]);
  if (!soundfont) return Promise.resolve(null);
  const inst = soundfont[instId];
  if (!inst || !inst[note]) return Promise.resolve(null);

  const a = ensureCtx();
  const dataUrl = inst[note];
  const b64 = dataUrl.split(',')[1];
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);

  return new Promise((resolve) => {
    // decodeAudioData detaches the input buffer, so .slice(0) copies it
    a.decodeAudioData(
      buf.slice(0),
      (decoded) => {
        BC[k] = decoded;
        resolve(decoded);
      },
      (err) => {
        console.warn('Decode error:', note, err);
        resolve(null);
      }
    );
  });
}

/**
 * Per-note gain compensation. The soundfont samples aren't perfectly
 * level-matched across the keyboard — some notes (Ab4, A4 area in the
 * piano sample set) sound noticeably quieter than their neighbours.
 *
 * Multiplicative on top of the master gain (2.5). Keys are instrument-
 * scoped so different instruments can have different compensation.
 * If a note isn't in the map, gain stays at 1.0 (no change).
 *
 * If you find another note that sounds off, add an entry here.
 */
const NOTE_GAIN: Partial<Record<InstrumentId, Record<string, number>>> = {
  acoustic_grand_piano: {
    Ab4: 1.4,   // min6 above C4 — noticeably quieter without boost
    A4:  1.25,  // M6 above C4 — slightly quieter too
    Bb4: 1.2,
    B4:  1.15,
  },
};

function playBuf(audioBuf: AudioBuffer, instId: InstrumentId, note: string): void {
  const a = ensureCtx();
  if (a.state === 'suspended') a.resume().catch(() => {});
  const src = a.createBufferSource();
  src.buffer = audioBuf;
  const g = a.createGain();
  const noteBoost = NOTE_GAIN[instId]?.[note] ?? 1;
  g.gain.value = 2.5 * noteBoost;
  src.connect(g).connect(a.destination);
  src.start(0);
}

/** Play a note on an instrument, with optional delay in seconds. */
export function pn(instId: InstrumentId, note: string, dl = 0): void {
  decodeNote(instId, note).then((buf) => {
    if (!buf) return;
    if (dl > 0) setTimeout(() => playBuf(buf, instId, note), dl * 1000);
    else playBuf(buf, instId, note);
  });
}

/** Play a MIDI number on the given instrument with optional delay. */
export function pm(instId: InstrumentId, midi: number, dl = 0): void {
  pn(instId, m2n(midi), dl);
}

/**
 * Play a phrase as semitone offsets from a root MIDI value, at a given tempo.
 * Used by song references in the FeedbackSheet to play the actual hook
 * from the song, transposed to whatever key the question was in.
 * Notes are kept within the soundfont range A3–G5 (MIDI 57–79) by
 * shifting whole octaves down (or up) on a per-note basis.
 *
 * @param instId    The instrument to play on
 * @param rootMidi  The MIDI value of the phrase's root (0 in the offsets)
 * @param offsets   Semitone offsets from root, one per note in the phrase
 * @param bpm       Tempo for the phrase (default 110). Each note is 1 beat.
 */
export function playPhrase(
  instId: InstrumentId,
  rootMidi: number,
  offsets: number[],
  bpm = 110,
): void {
  const beat = 60 / bpm;
  offsets.forEach((off, i) => {
    let n = rootMidi + off;
    while (n > 79) n -= 12;
    while (n < 57) n += 12;
    pm(instId, n, i * beat);
  });
}
