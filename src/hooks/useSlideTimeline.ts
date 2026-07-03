import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AnimType, Slide } from '../types/slides';

export interface TimelineController {
  elapsed: number; // seconds
  playing: boolean;
  progress: number; // 0..1 across the slide duration
  activeElement: string | null; // element currently being narrated
  isRevealed: (element: string) => boolean;
  animationOf: (element: string) => AnimType | undefined;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  revealAll: () => void;
}

/**
 * Drives the on-stage reveal timeline with an independent wall-clock (rAF).
 * Kept decoupled from the actual audio currentTime so animations are reliable
 * whether narration plays from a real MP3 or the TTS fallback (as permitted).
 */
export function useSlideTimeline(slide: Slide, autoStart: boolean): TimelineController {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const stopRaf = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTsRef.current = null;
  }, []);

  // The animation clock.
  useEffect(() => {
    if (!playing) {
      stopRaf();
      return;
    }
    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setElapsed((prev) => {
        const next = prev + dt;
        if (next >= slide.duration) {
          setPlaying(false);
          return slide.duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return stopRaf;
  }, [playing, slide.duration, stopRaf]);

  // Reset whenever the slide changes.
  useEffect(() => {
    setElapsed(0);
    setPlaying(autoStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide.id]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const restart = useCallback(() => {
    setElapsed(0);
    setPlaying(true);
  }, []);
  const revealAll = useCallback(() => {
    setElapsed(slide.duration);
    setPlaying(false);
  }, [slide.duration]);

  const isRevealed = useCallback(
    (element: string) => {
      const ev = slide.timeline.find((t) => t.element === element);
      // Elements without a timeline entry are always visible.
      if (!ev) return true;
      return elapsed >= ev.time;
    },
    [elapsed, slide.timeline],
  );

  const animationOf = useCallback(
    (element: string) => slide.timeline.find((t) => t.element === element)?.animation,
    [slide.timeline],
  );

  // The most recently revealed element = what the narration is talking about now.
  const activeElement = useMemo(() => {
    let best: string | null = null;
    let bestTime = -1;
    for (const ev of slide.timeline) {
      if (ev.time <= elapsed && ev.time >= bestTime) {
        bestTime = ev.time;
        best = ev.element;
      }
    }
    return best;
  }, [elapsed, slide.timeline]);

  return {
    elapsed,
    playing,
    progress: Math.min(1, elapsed / slide.duration),
    activeElement,
    isRevealed,
    animationOf,
    play,
    pause,
    toggle,
    restart,
    revealAll,
  };
}
