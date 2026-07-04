/**
 * Studio settings — global, persisted, changeable from any game's topbar:
 * - autoAdvance: reveal auto-continues after a beat vs. waiting for Continue
 * - strictness: scales every accuracy tolerance (learn at your own pace)
 */

export type Strictness = 'loose' | 'normal' | 'strict';

export interface StudioSettings {
  autoAdvance: boolean;
  strictness: Strictness;
}

const KEY = 'ear-trainer.studio.settings.v1';

const DEFAULTS: StudioSettings = { autoAdvance: true, strictness: 'normal' };

export function getSettings(): StudioSettings {
  try {
    if (typeof localStorage === 'undefined') return DEFAULTS;
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<StudioSettings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function setSettings(patch: Partial<StudioSettings>): StudioSettings {
  const next = { ...getSettings(), ...patch };
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — session only */
  }
  return next;
}

/** Tolerance multiplier applied inside the accuracy functions. */
export function strictnessFactor(s: Strictness = getSettings().strictness): number {
  return s === 'loose' ? 1.5 : s === 'strict' ? 0.65 : 1;
}
