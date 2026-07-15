import { useEffect, useRef, useState } from 'react';
import { useNarrationContext } from '../components/audio/NarrationContext';
import type { AudioAlignment } from '../data/audioAlignments';
import { spokenFromAudioAlignment, spokenFromAudioProgress, spokenFromTtsCue } from '../lib/storyTiming';

const CPS = 10.8; // Arabic TTS fallback estimate when browsers skip word boundaries
const NO_VOICE_FALLBACK = 10000; // ms: only simulate progress after a genuine start failure
const TTS_START_GUARD = 300; // short audible-start guard without making Nasser feel late
type AudioAlignmentMap = Readonly<Record<string, AudioAlignment>>;
let audioAlignmentsPromise: Promise<AudioAlignmentMap> | null = null;

function loadAudioAlignments() {
  audioAlignmentsPromise ??= import('../data/audioAlignments').then((module) => module.audioAlignments);
  return audioAlignmentsPromise;
}

export interface VoiceSync {
  spoken: number;
  progress: number; // 0..1 — starts & ends with the ACTUAL voice
  done: boolean;
}

/**
 * Single source of truth for "where the voice is". Reveal, highlight and the
 * progress bar advance ONLY once the voice actually starts (onstart / boundary),
 * so nothing moves before the audio begins. If no voice ever starts (no TTS
 * installed), it falls back to revealing everything after a short wait.
 */
export function useVoiceSync(
  narrationText: string,
  audioKey: string,
  armed: boolean,
  resetKey: string,
  mutedReveal = false,
): VoiceSync {
  const {
    charIndex,
    speechStartedAt,
    ttsCueStart,
    ttsCueEnd,
    isPlaying,
    isPaused,
    nowKey,
    status,
    source,
    boundaryUpdatedAt,
    audioElapsed,
    audioDuration,
    rate,
    getAudioClock,
  } = useNarrationContext();
  const total = Math.max(1, narrationText.length);

  const [spoken, setSpoken] = useState(0);
  const [done, setDone] = useState(false);

  const alignmentsRef = useRef<AudioAlignmentMap | null>(null);
  const spokenRef = useRef(0);
  const enterRef = useRef(performance.now());
  const speakStartRef = useRef<number | null>(null);

  // Reset on slide change / replay, done SYNCHRONOUSLY during render (not in
  // a useEffect) -- an effect-based reset lands one commit late, so on the
  // very first render of a new slide `spoken` is still the previous slide's
  // (often near-total) value. Any consumer that reads `spoken` on that first
  // render -- e.g. a "narration finished" gate for a quick-check popup --
  // would see a false "already finished" and fire immediately. Resetting
  // mid-render (React's documented pattern for derived state) means the
  // very first render of a new slide already reports spoken = 0.
  const resetKeyRef = useRef(resetKey);
  if (resetKeyRef.current !== resetKey) {
    resetKeyRef.current = resetKey;
    spokenRef.current = 0;
    enterRef.current = performance.now();
    speakStartRef.current = null;
    if (spoken !== 0) setSpoken(0);
    if (done) setDone(false);
  }
  const charRef = useRef(0);
  charRef.current = charIndex;
  const audioElapsedRef = useRef(0);
  const audioDurationRef = useRef<number | null>(null);
  const boundaryUpdatedAtRef = useRef<number | null>(null);
  const ttsCueStartRef = useRef(0);
  const ttsCueEndRef = useRef(0);
  const sourceRef = useRef<typeof source>(source);
  const rateRef = useRef(rate);
  const textRef = useRef(narrationText);
  audioElapsedRef.current = audioElapsed;
  audioDurationRef.current = audioDuration;
  boundaryUpdatedAtRef.current = boundaryUpdatedAt;
  ttsCueStartRef.current = ttsCueStart;
  ttsCueEndRef.current = ttsCueEnd;
  sourceRef.current = source;
  rateRef.current = rate;
  textRef.current = narrationText;

  const isThisSlide = nowKey === audioKey;
  const speaking = isPlaying && isThisSlide;
  const paused = isPaused && isThisSlide;

  const speakingRef = useRef(false);
  speakingRef.current = speaking;

  const startedAtRef = useRef<number | null>(null);
  startedAtRef.current = speechStartedAt;

  useEffect(() => {
    if (!armed) return;
    let cancelled = false;
    loadAudioAlignments().then((alignments) => {
      if (!cancelled) alignmentsRef.current = alignments;
    });
    return () => {
      cancelled = true;
    };
  }, [armed, audioKey]);

  // Real voice finished (boundaries advanced) → snap to complete.
  useEffect(() => {
    if (speaking) {
      if (speakStartRef.current == null) speakStartRef.current = performance.now();
    }
    if (isThisSlide && status === 'idle' && (charRef.current > 0 || spokenRef.current > 0)) {
      spokenRef.current = total;
      setSpoken(total);
      setDone(true);
    }
  }, [speaking, status, isThisSlide, total]);

  // Reveal clock.
  useEffect(() => {
    if (!armed || done || paused) return;

    if (!armed) {
      spokenRef.current = total;
      setSpoken(total);
      return;
    }

    let raf = 0;
    let throttleTimer: number | null = null;
    // Defensive guard against a pathological requestAnimationFrame burst
    // (many callbacks firing back-to-back without a real paint in between —
    // observed in automated/CDP-driven browsers under heavy load). A real
    // ~60fps cadence never comes close to this many ticks in 50ms; if it
    // ever does, skip the state-update work for a moment via a throttled
    // timeout instead of hammering setState fast enough to trip React's
    // nested-update warning.
    let burstWindowStart = performance.now();
    let burstTicks = 0;
    const tick = () => {
      const now0 = performance.now();
      if (now0 - burstWindowStart < 50) {
        burstTicks += 1;
        if (burstTicks > 40) {
          throttleTimer = window.setTimeout(() => {
            throttleTimer = null;
            raf = requestAnimationFrame(tick);
          }, 32);
          return;
        }
      } else {
        burstWindowStart = now0;
        burstTicks = 0;
      }
      let val = spokenRef.current;
      if (speakingRef.current) {
        if (sourceRef.current === 'audio') {
          const liveClock = getAudioClock();
          const duration = liveClock?.duration ?? audioDurationRef.current;
          const elapsed = liveClock?.elapsed ?? audioElapsedRef.current;
          const alignment = alignmentsRef.current?.[audioKey];
          val = alignment
            ? spokenFromAudioAlignment(total, elapsed, alignment.anchors)
            : duration && duration > 0
              ? spokenFromAudioProgress(textRef.current, elapsed / duration)
              : charRef.current;
        } else {
          const start = startedAtRef.current ?? speakStartRef.current ?? performance.now();
          const now = performance.now();
          const heardStart = start + TTS_START_GUARD;
          const el = Math.max(0, (now - heardStart) / 1000);
          const hasRecentBoundary =
            charRef.current > 0 &&
            boundaryUpdatedAtRef.current != null &&
            now - boundaryUpdatedAtRef.current < 1400;
          // Follow real word boundaries when present. Safari/iOS often skips them,
          // so only fall back to the smooth clock after the audible-start guard.
          const effectiveRate = /iphone|ipad|ipod/i.test(navigator.userAgent) ? Math.min(rateRef.current, 1.08) : rateRef.current;
          const estimatedInCue = spokenFromTtsCue(
            ttsCueStartRef.current,
            ttsCueEndRef.current || total,
            el,
            effectiveRate,
            CPS,
          );
          val = hasRecentBoundary
            ? charRef.current
            : now < heardStart
              ? ttsCueStartRef.current
              : Math.max(charRef.current, estimatedInCue);
        }
      } else if (performance.now() - enterRef.current > NO_VOICE_FALLBACK && charRef.current === 0) {
        // Voice failed to start: keep a gradual narrated sequence instead of
        // revealing every element at once.
        val = ((performance.now() - enterRef.current - NO_VOICE_FALLBACK) / 1000) * CPS * rateRef.current;
      } else {
        val = 0; // waiting for the voice to begin (title only)
      }
      const next = Math.min(total, Math.max(spokenRef.current, val));
      if (next !== spokenRef.current) {
        spokenRef.current = next;
        setSpoken(next);
      }
      if (next < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (throttleTimer != null) window.clearTimeout(throttleTimer);
    };
  }, [armed, audioKey, done, getAudioClock, paused, total, resetKey]);

  // Muted → nothing will ever play, so reveal everything for reading.
  // A merely "not started yet" state (armed=false but not muted) must NOT
  // do this: it used to reveal-all before the very first play press, which
  // made every narration-gated interaction (station cards, quick checks,
  // reveal buttons) look "ready" while Nasser had never actually spoken —
  // clicking them appeared to do nothing because their own guards additionally
  // check that real speech has happened.
  useEffect(() => {
    if (!armed && mutedReveal) {
      spokenRef.current = total;
      setSpoken(total);
    }
  }, [armed, mutedReveal, total]);

  return {
    spoken,
    progress: done ? 1 : Math.min(1, spoken / total),
    done,
  };
}
