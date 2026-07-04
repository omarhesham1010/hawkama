import { useCallback, useEffect, useRef, useState } from 'react';
import { hasAudio } from '../data/audioManifest';

export type NarrationStatus = 'idle' | 'loading' | 'playing' | 'paused';
export type NarrationSource = 'audio' | 'tts' | null;

const base = import.meta.env.BASE_URL || '/';
const VOICE_KEY = 'gov-voice';
const RATE_KEY = 'gov-voice-rate';
const TTS_LEAD_IN = '\u200f\u200c\u200c\u200c ';

// Voice preference: a "Shaker"-named voice first, then any clearly male Arabic voice.
const SHAKER = /shaker|شاكر/i;
const MALE_TOKENS = /shaker|naayf|nayf|hamed|majed|male|tarik|omar|khalid|rashid|hoss/i;
const FEMALE_TOKENS = /hoda|salma|zariyah|amany|laila|female|zeina/i;
const SHAKER_ALIASES = /shaker|shaakir|shakir|شاكر/i;

function isIOSWebKit() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function pickPreferredVoice(explicitURI: string | null): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis?.getVoices?.() ?? [];
  if (!all.length) return null;
  if (explicitURI) {
    const found = all.find((v) => v.voiceURI === explicitURI);
    if (found) return found;
  }
  const arabic = all.filter((v) => v.lang?.toLowerCase().startsWith('ar'));
  const pool = arabic.length ? arabic : all;
  return (
    pool.find((v) => SHAKER.test(v.name) || SHAKER_ALIASES.test(v.name)) ??
    pool.find((v) => MALE_TOKENS.test(v.name) && !FEMALE_TOKENS.test(v.name)) ??
    arabic.find((v) => /ar-sa/i.test(v.lang) && !FEMALE_TOKENS.test(v.name)) ??
    arabic.find((v) => !FEMALE_TOKENS.test(v.name)) ??
    arabic[0] ??
    null
  );
}

export function useNarration() {
  const [status, setStatus] = useState<NarrationStatus>('idle');
  const [source, setSource] = useState<NarrationSource>(null);
  const [charIndex, setCharIndex] = useState(0); // position of the word being spoken (TTS)
  const [speechStartedAt, setSpeechStartedAt] = useState<number | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURIState] = useState<string | null>(
    () => (typeof window !== 'undefined' ? window.localStorage.getItem(VOICE_KEY) : null),
  );
  const [rate, setRateState] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    return Number(window.localStorage.getItem(RATE_KEY)) || 1;
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastRef = useRef<{ key: string; script: string } | null>(null);
  const sourceRef = useRef<NarrationSource>(null);
  const keepAliveRef = useRef<number | null>(null);

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!ttsSupported) return;
    const refresh = () => {
      const all = window.speechSynthesis.getVoices();
      const arabic = all.filter((v) => v.lang?.toLowerCase().startsWith('ar'));
      setVoices(arabic.length ? arabic : all);
    };
    refresh();
    window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', refresh);
  }, [ttsSupported]);

  const setVoiceURI = useCallback((uri: string | null) => {
    setVoiceURIState(uri);
    if (uri) window.localStorage.setItem(VOICE_KEY, uri);
    else window.localStorage.removeItem(VOICE_KEY);
  }, []);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    window.localStorage.setItem(RATE_KEY, String(r));
  }, []);

  // Spin up the TTS engine on first user gesture so the first real utterance
  // starts with far less latency.
  const warmedRef = useRef(false);
  const warmup = useCallback(() => {
    if (!ttsSupported || warmedRef.current) return;
    warmedRef.current = true;
    try {
      window.speechSynthesis.getVoices();
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {
      /* no-op */
    }
  }, [ttsSupported]);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current != null) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  // Chrome silently stops utterances longer than ~15s; pinging resume() keeps it alive.
  const startKeepAlive = useCallback(() => {
    clearKeepAlive();
    keepAliveRef.current = window.setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 9000);
  }, [clearKeepAlive]);

  const stopInternal = useCallback(() => {
    clearKeepAlive();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    // Only cancel if something is actually speaking/queued — calling cancel()
    // on an idle engine is pure overhead and was adding to slide-to-slide latency.
    if (ttsSupported && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
      window.speechSynthesis.cancel();
    }
    utterRef.current = null;
    sourceRef.current = null;
    setSpeechStartedAt(null);
  }, [clearKeepAlive, ttsSupported]);

  const speakTts = useCallback(
    (script: string) => {
      if (!ttsSupported) {
        setStatus('idle');
        return;
      }
      const synth = window.speechSynthesis;
      setStatus('loading');

      const doSpeak = () => {
        const spokenScript = `${TTS_LEAD_IN}${script}`;
        const u = new SpeechSynthesisUtterance(spokenScript);
        u.lang = 'ar-SA';
        u.rate = isIOSWebKit() ? Math.min(rate, 1.08) : rate;
        u.pitch = 0.92;
        const voice = pickPreferredVoice(voiceURI);
        if (voice) u.voice = voice;
        u.onstart = () => {
          setSource('tts');
          sourceRef.current = 'tts';
          setStatus('playing');
          setCharIndex(0);
          setSpeechStartedAt(performance.now());
          startKeepAlive();
        };
        u.onboundary = (e) => setCharIndex(Math.max(0, (e.charIndex ?? 0) - TTS_LEAD_IN.length));
        u.onend = () => {
          clearKeepAlive();
          setSpeechStartedAt(null);
          setStatus('idle');
        };
        u.onerror = () => {
          clearKeepAlive();
          setSpeechStartedAt(null);
          setStatus('idle');
        };
        utterRef.current = u;
        synth.speak(u);
      };

      // Only cancel (and wait briefly for it to flush) if the engine is busy.
      // The common case — nothing speaking between slides — starts instantly.
      if (synth.speaking || synth.pending) {
        synth.cancel();
        window.setTimeout(doSpeak, 20);
      } else {
        doSpeak();
      }
    },
    [rate, voiceURI, ttsSupported, startKeepAlive, clearKeepAlive],
  );

  const play = useCallback(
    (key: string, script: string) => {
      stopInternal();
      lastRef.current = { key, script };
      setCharIndex(0);
      setSpeechStartedAt(null);

      // No real MP3 for this key → go straight to TTS (instant, no probe delay).
      if (!hasAudio(key)) {
        speakTts(script);
        return;
      }

      setStatus('loading');
      const audio = new Audio(`${base}audio/${key}.mp3`);
      audio.preload = 'auto';
      audioRef.current = audio;
      let handledFallback = false;
      const fallback = () => {
        if (handledFallback) return;
        handledFallback = true;
        audioRef.current = null;
        speakTts(script);
      };
      audio.addEventListener('playing', () => {
        setSource('audio');
        sourceRef.current = 'audio';
        setStatus('playing');
        setSpeechStartedAt(performance.now());
      });
      audio.addEventListener('ended', () => {
        setSpeechStartedAt(null);
        setStatus('idle');
      });
      audio.addEventListener('error', fallback);
      audio.play().catch(() => {
        // If the browser blocks autoplay for an existing MP3, do not fall back
        // to device TTS; that would change Shakir's fixed voice on mobile.
        setStatus('idle');
        setSource(null);
        sourceRef.current = null;
        setSpeechStartedAt(null);
      });
    },
    [speakTts, stopInternal],
  );

  const pause = useCallback(() => {
    if (sourceRef.current === 'audio' && audioRef.current) {
      audioRef.current.pause();
      setStatus('paused');
    } else if (sourceRef.current === 'tts' && ttsSupported) {
      clearKeepAlive();
      window.speechSynthesis.pause();
      setStatus('paused');
    }
  }, [clearKeepAlive, ttsSupported]);

  const resume = useCallback(() => {
    if (sourceRef.current === 'audio' && audioRef.current) {
      audioRef.current.play().catch(() => undefined);
      setSpeechStartedAt(performance.now());
      setStatus('playing');
    } else if (sourceRef.current === 'tts' && ttsSupported) {
      window.speechSynthesis.resume();
      startKeepAlive();
      setSpeechStartedAt(performance.now());
      setStatus('playing');
    }
  }, [startKeepAlive, ttsSupported]);

  const stop = useCallback(() => {
    stopInternal();
    setStatus('idle');
    setSource(null);
    setSpeechStartedAt(null);
  }, [stopInternal]);

  const replay = useCallback(() => {
    if (lastRef.current) play(lastRef.current.key, lastRef.current.script);
  }, [play]);

  useEffect(() => () => stopInternal(), [stopInternal]);

  return {
    status,
    source,
    isPlaying: status === 'playing',
    isLoading: status === 'loading',
    isPaused: status === 'paused',
    charIndex,
    speechStartedAt,
    ttsSupported,
    voices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    play,
    pause,
    resume,
    stop,
    replay,
    warmup,
  };
}
