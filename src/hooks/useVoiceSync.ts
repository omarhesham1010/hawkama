import { useEffect, useRef, useState } from 'react';
import { useNarrationContext } from '../components/audio/NarrationContext';
import { spokenFromAudioProgress } from '../lib/storyTiming';

const CPS = 10.8; // Arabic TTS fallback estimate when browsers skip word boundaries
const NO_VOICE_FALLBACK = 10000; // ms: only simulate progress after a genuine start failure
const TTS_START_GUARD = 300; // short audible-start guard without making Nasser feel late

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
): VoiceSync {
  const {
    charIndex,
    speechStartedAt,
    isPlaying,
    isPaused,
    nowKey,
    status,
    source,
    boundaryUpdatedAt,
    audioElapsed,
    audioDuration,
    audioUpdatedAt,
  } = useNarrationContext();
  const total = Math.max(1, narrationText.length);

  const [spoken, setSpoken] = useState(0);
  const [done, setDone] = useState(false);

  const spokenRef = useRef(0);
  const enterRef = useRef(performance.now());
  const speakStartRef = useRef<number | null>(null);
  const charRef = useRef(0);
  charRef.current = charIndex;
  const audioElapsedRef = useRef(0);
  const audioDurationRef = useRef<number | null>(null);
  const audioUpdatedAtRef = useRef<number | null>(null);
  const boundaryUpdatedAtRef = useRef<number | null>(null);
  const sourceRef = useRef<typeof source>(source);
  const textRef = useRef(narrationText);
  audioElapsedRef.current = audioElapsed;
  audioDurationRef.current = audioDuration;
  audioUpdatedAtRef.current = audioUpdatedAt;
  boundaryUpdatedAtRef.current = boundaryUpdatedAt;
  sourceRef.current = source;
  textRef.current = narrationText;

  const isThisSlide = nowKey === audioKey;
  const speaking = isPlaying && isThisSlide;
  const paused = isPaused && isThisSlide;

  const speakingRef = useRef(false);
  speakingRef.current = speaking;

  const startedAtRef = useRef<number | null>(null);
  startedAtRef.current = speechStartedAt;

  // Reset on slide change / replay.
  useEffect(() => {
    spokenRef.current = 0;
    enterRef.current = performance.now();
    speakStartRef.current = null;
    setSpoken(0);
    setDone(false);
  }, [resetKey]);

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
    const tick = () => {
      let val = spokenRef.current;
      if (speakingRef.current) {
        if (sourceRef.current === 'audio') {
          const duration = audioDurationRef.current;
          const clockDrift = audioUpdatedAtRef.current ? (performance.now() - audioUpdatedAtRef.current) / 1000 : 0;
          const elapsed = audioElapsedRef.current + clockDrift;
          val = duration && duration > 0 ? spokenFromAudioProgress(textRef.current, elapsed / duration) : charRef.current;
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
          val = hasRecentBoundary ? charRef.current : now < heardStart ? 0 : Math.max(charRef.current, el * CPS);
        }
      } else if (performance.now() - enterRef.current > NO_VOICE_FALLBACK && charRef.current === 0) {
        // Voice failed to start: keep a gradual narrated sequence instead of
        // revealing every element at once.
        val = ((performance.now() - enterRef.current - NO_VOICE_FALLBACK) / 1000) * CPS;
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
    return () => cancelAnimationFrame(raf);
  }, [armed, done, paused, total, resetKey]);

  // Muted / not armed → reveal all.
  useEffect(() => {
    if (!armed) {
      spokenRef.current = total;
      setSpoken(total);
    }
  }, [armed, total]);

  return {
    spoken,
    progress: done ? 1 : Math.min(1, spoken / total),
    done,
  };
}
