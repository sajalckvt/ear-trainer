/**
 * Studio progress — per-game unlocked level + best score, in localStorage.
 * No backend: progress lives on the device, same as the rest of the app.
 */

const KEY = 'ear-trainer.studio.v1';

interface GameProgress {
  level: number;      // highest unlocked level (1-based)
  bestScore: number;  // best single-run score
}

type ProgressMap = Record<string, GameProgress>;

function load(): ProgressMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function save(map: ProgressMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable (private mode) — progress is session-only */
  }
}

export function getProgress(gameId: string): GameProgress {
  return load()[gameId] ?? { level: 1, bestScore: 0 };
}

/** Record a finished run; unlocks the next level if the run was completed. */
export function recordRun(gameId: string, opts: { score: number; completedLevel?: number }): void {
  const map = load();
  const cur = map[gameId] ?? { level: 1, bestScore: 0 };
  const next: GameProgress = {
    level: opts.completedLevel !== undefined && opts.completedLevel >= cur.level
      ? opts.completedLevel + 1
      : cur.level,
    bestScore: Math.max(cur.bestScore, opts.score),
  };
  map[gameId] = next;
  save(map);
}
