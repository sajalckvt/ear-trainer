import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'et_timer';

function getWeekKey(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const wk = Math.ceil((((d.getTime() - jan1.getTime()) / 86400000) + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}_w${wk}`;
}

function loadSavedSecs(weekKey: string): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const saved = JSON.parse(raw) as { week?: string; secs?: number };
    if (saved.week === weekKey) return saved.secs ?? 0;
    return 0; // new week → reset
  } catch {
    return 0;
  }
}

function saveSecs(weekKey: string, secs: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ week: weekKey, secs }));
  } catch {
    /* quota / private mode → ignore */
  }
}

export function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function useTrainingTimer() {
  const weekKeyRef = useRef<string>(getWeekKey());
  const [seconds, setSeconds] = useState<number>(() => loadSavedSecs(weekKeyRef.current));
  const lastActionRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userActive = useCallback(() => {
    lastActionRef.current = Date.now();
  }, []);

  useEffect(() => {
    // Track activity globally
    document.addEventListener('click', userActive);
    document.addEventListener('touchstart', userActive, { passive: true });

    // Tick once per second, only count if user was active recently
    intervalRef.current = setInterval(() => {
      if (Date.now() - lastActionRef.current < 30_000) {
        setSeconds((s) => {
          const next = s + 1;
          if (next % 5 === 0) saveSecs(weekKeyRef.current, next);
          return next;
        });
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('click', userActive);
      document.removeEventListener('touchstart', userActive);
    };
  }, [userActive]);

  const reset = useCallback(() => {
    setSeconds(0);
    saveSecs(weekKeyRef.current, 0);
  }, []);

  return { seconds, formatted: formatTime(seconds), reset };
}
