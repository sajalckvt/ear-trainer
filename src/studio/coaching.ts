/**
 * Miss coaching — detects repeated error patterns per game and returns a
 * one-line tip for the reveal banner. Pure logic, no React, no storage
 * (rolling in-memory window per game).
 *
 * A tip fires only when ≥2 recent misses share a direction or confusion,
 * or after 3 consecutive misses of any kind (generic slow-down tip).
 */

export type MissRecord =
  | { kind: 'direction'; axis: string; sign: -1 | 1 }
  | { kind: 'confusion'; tag: string }
  | { kind: 'wrong' };

interface Entry {
  missed: boolean;
  rec?: MissRecord;
}

const WINDOW = 20;
const RECENT = 6;

const buffers: Record<string, Entry[]> = {};

/** Record a stage result and return a coaching tip (or null). */
export function coach(gameId: string, missed: boolean, rec?: MissRecord): string | null {
  const buf = (buffers[gameId] ??= []);
  buf.push({ missed, rec: missed ? rec : undefined });
  if (buf.length > WINDOW) buf.splice(0, buf.length - WINDOW);
  if (!missed) return null;

  const recent = buf.slice(-RECENT);
  const misses = recent.filter((e) => e.missed);

  // Pattern 1: repeated same-direction misses
  if (rec?.kind === 'direction') {
    const same = misses.filter(
      (e) => e.rec?.kind === 'direction' && e.rec.axis === rec.axis && e.rec.sign === rec.sign,
    );
    if (same.length >= 2) {
      const tip = directionTip(gameId, rec.axis, rec.sign);
      if (tip) return tip;
    }
  }

  // Pattern 2: repeated same confusion
  if (rec?.kind === 'confusion') {
    const same = misses.filter((e) => e.rec?.kind === 'confusion' && e.rec.tag === rec.tag);
    if (same.length >= 2) {
      const tip = confusionTip(gameId, rec.tag);
      if (tip) return tip;
    }
  }

  // Pattern 3: three consecutive misses → generic slow-down
  const lastThree = buf.slice(-3);
  if (lastThree.length === 3 && lastThree.every((e) => e.missed)) {
    return 'Three misses running — slow down and A/B each option twice before answering.';
  }

  return null;
}

/** Reset a game's window (unused for now; handy for tests). */
export function resetCoach(gameId: string): void {
  delete buffers[gameId];
}

// ─── Tip texts (owner-approved wording) ──────────────────────────────────────

function directionTip(gameId: string, axis: string, sign: -1 | 1): string | null {
  if (axis === 'freq' && gameId === 'eq-boost') {
    return sign < 0
      ? "Your guesses run low — 'harsh' usually means 2–5 kHz, 'boomy' means under 250 Hz."
      : 'Your guesses run high — thickness and mud live down at 100–400 Hz.';
  }
  if (axis === 'pan') {
    const side = sign < 0 ? 'left' : 'right';
    return `Your picks lean ${side} of the target — check your headphone seating and volume balance.`;
  }
  if (axis === 'width' && sign > 0) {
    return "You're over-calling width — imagine collapsing it to mono; if little would change, it's narrow.";
  }
  return null;
}

function confusionTip(gameId: string, tag: string): string | null {
  if (tag.startsWith('stem:')) {
    const [, stem, dir] = tag.split(':');
    return `The ${stem} keeps landing ${dir} — A/B one fader at a time instead of the whole mix.`;
  }
  const TIPS: Record<string, string> = {
    'delay-time:shorter':
      'You keep hearing it shorter — under ~120 ms reads as slapback; real echoes past 350 ms detach from the note.',
    'delay-time:longer':
      "You keep hearing it longer — tight doubles under 120 ms hide inside the note's attack.",
    'compressor-copy:attack':
      "Attack check: if the drum still snaps, attack is slow; if the hit is flattened, it's fast.",
    'compressor-copy:release':
      'Release check: pumping/breathing = fast release; smooth but choked = slow.',
    'gain-difference:smaller':
      "You're underestimating gain jumps — recall +6 dB is roughly 'twice as loud-ish', +12 dB is unmistakable.",
    'eq-copy:freq-off':
      'Frequency is your gap, not amount — sweep your node past the target and back to bracket it.',
  };
  return TIPS[`${gameId}:${tag}`] ?? null;
}
