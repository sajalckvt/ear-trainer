/**
 * YouTubeClip — plays a [start,end] window of a YouTube video, with optional
 * segment looping. Used by the song-progression quiz so the user hears the
 * ACTUAL recording (no synthesis, nothing hosted by us).
 *
 * Implementation notes:
 *  - Loads the IFrame Player API script once, globally.
 *  - We poll getCurrentTime() on a timer; when the playhead passes `end` we
 *    either seek back to `start` (loop) or pause (one-shot). The API's own
 *    `end` playerVar only fires on the initial cue, so polling is the reliable
 *    way to loop an arbitrary inner segment — and the same mechanism lets one
 *    track expose several clips (intro, chorus…) at different windows.
 *  - The player stays visible (small) to respect YouTube's embed terms.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Minimal YT IFrame API typings ───────────────────────────────────────────
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  destroy(): void;
}
interface YTPlayerEvent { target: YTPlayer; data?: number; }
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (e: YTPlayerEvent) => void;
        onStateChange?: (e: YTPlayerEvent) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Load the API script once; resolve when window.YT is ready.
let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.getElementById('yt-iframe-api')) {
      const s = document.createElement('script');
      s.id = 'yt-iframe-api';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
  return apiPromise;
}

export interface YouTubeClipProps {
  videoId: string;
  start: number;
  end: number;
  /** loop the segment instead of stopping at `end` */
  loop?: boolean;
}

export function YouTubeClip({ videoId, start, end, loop = true }: YouTubeClipProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const pollRef = useRef<number | null>(null);
  const loopRef = useRef(loop);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => { loopRef.current = loop; }, [loop]);

  // Build the player once per (videoId, start).
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          start: Math.floor(start),
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => { if (!cancelled) setReady(true); },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) setPlaying(false);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (pollRef.current) window.clearInterval(pollRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, start]);

  // Poll the playhead to enforce the [start,end] window.
  useEffect(() => {
    if (!ready) return;
    pollRef.current = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const t = p.getCurrentTime();
      if (t >= end) {
        if (loopRef.current) p.seekTo(start, true);
        else { p.pauseVideo(); p.seekTo(start, true); }
      }
    }, 200);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [ready, start, end]);

  const playClip = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(start, true);
    p.playVideo();
  }, [start]);

  const pauseClip = useCallback(() => { playerRef.current?.pauseVideo(); }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="yt-clip">
      <div className="yt-frame">
        <div ref={hostRef} />
      </div>
      <div className="yt-controls">
        <button className="yt-btn" disabled={!ready} onClick={playing ? pauseClip : playClip}>
          {playing ? '❚❚ Pause' : ready ? '▶ Play clip' : 'Loading…'}
        </button>
        <span className="yt-window">{fmt(start)}–{fmt(end)}{loop ? ' ↻ loop' : ''}</span>
      </div>
    </div>
  );
}
