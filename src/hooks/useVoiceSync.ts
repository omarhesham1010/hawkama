import { useEffect, useRef, useState } from 'react';
import { useNarrationContext } from '../components/audio/NarrationContext';

const CPS = 12.5; // chars/sec estimate while speaking without word boundaries
const NO_VOICE_FALLBACK = 3500; // ms: if the voice never starts, reveal anyway

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
  totalChars: number,
  audioKey: string,
  armed: boolean,
  resetKey: string,
): VoiceSync {
  const { charIndex, speechStartedAt, isPlaying, isPaused, nowKey, status } = useNarrationContext();
  const total = Math.max(1, totalChars);

  const [spoken, setSpoken] = useState(0);
  const [done, setDone] = useState(false);

  const spokenRef = useRef(0);
  const enterRef = useRef(performance.now());
  const speakStartRef = useRef<number | null>(null);
  const charRef = useRef(0);
  charRef.current = charIndex;

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
        const start = startedAtRef.current ?? speakStartRef.current ?? performance.now();
        const el = (performance.now() - start) / 1000;
        // Follow real word boundaries when present. Safari/iOS often skips them,
        // so keep a smooth estimated clock tied to the actual speech start.
        val = Math.max(charRef.current, el * CPS);
      } else if (performance.now() - enterRef.current > NO_VOICE_FALLBACK && charRef.current === 0) {
        // voice never started → reveal everything
        val = total;
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
