"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
    __klypYTReady?: Promise<void>;
  }
}

function loadYouTubeAPI(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (window.__klypYTReady) return window.__klypYTReady;

  window.__klypYTReady = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return window.__klypYTReady;
}

/**
 * Mounts a YouTube segment player that loops [start, end] and reports the
 * current clip-relative time (seconds, 0 = clip start).
 */
export function useYouTubePlayer(opts: {
  videoId: string;
  start: number;
  end: number;
  active: boolean;
  onTime: (t: number, abs: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const onTimeRef = useRef(opts.onTime);
  onTimeRef.current = opts.onTime;

  useEffect(() => {
    if (!opts.active) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    loadYouTubeAPI().then(() => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: opts.videoId,
        playerVars: {
          start: opts.start,
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          controls: 1,
          iv_load_policy: 3,
          disablekb: 1,
        },
        events: {
          onStateChange: (e: any) => {
            if (e.data === window.YT?.PlayerState?.ENDED) {
              playerRef.current?.seekTo(opts.start, true);
              playerRef.current?.playVideo();
            }
          },
        },
      });

      interval = setInterval(() => {
        const p = playerRef.current;
        if (!p?.getCurrentTime) return;
        const abs = p.getCurrentTime();
        if (typeof abs !== "number") return;
        if (abs >= opts.end - 0.35) {
          p.seekTo(opts.start, true);
          return;
        }
        onTimeRef.current(Math.max(0, abs - opts.start), abs);
      }, 200);
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.active, opts.videoId, opts.start, opts.end]);

  const seekTo = (clipTime: number) => {
    playerRef.current?.seekTo?.(opts.start + clipTime, true);
    playerRef.current?.playVideo?.();
  };

  return { hostRef, seekTo };
}
