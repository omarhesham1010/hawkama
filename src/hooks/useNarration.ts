import { useCallback, useEffect, useRef, useState } from 'react';
import { hasAudio } from '../data/audioManifest';
import { ttsChunks } from '../lib/storyTiming';

export type NarrationStatus = 'idle' | 'loading' | 'playing' | 'paused';
export type NarrationSource = 'audio' | 'tts' | null;

const base = import.meta.env.BASE_URL || '/';
const VOICE_KEY = 'gov-voice';
const RATE_KEY = 'gov-voice-rate';

// Voice preference: a "Shaker"-named voice first, then any clearly male Arabic voice.
const SHAKER = /shaker|شاكر/i;
const MALE_TOKENS = /shaker|naayf|nayf|hamed|majed|male|tarik|omar|khalid|rashid|hoss/i;
const FEMALE_TOKENS = /hoda|salma|zariyah|amany|laila|female|zeina/i;
const SHAKER_ALIASES = /shaker|shaakir|shakir|شاكر/i;

function isIOSWebKit() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

const preloadedAudio = new Map<string, HTMLAudioElement>();

export function preloadNarrationAudio(key: string) {
  if (typeof window === 'undefined' || !hasAudio(key) || preloadedAudio.has(key)) return;
  const base = import.meta.env.BASE_URL || '/';
  const audio = new Audio(`${base}audio/${key}.mp3`);
  audio.preload = 'auto';
  audio.load();
  preloadedAudio.set(key, audio);
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
  const [boundaryUpdatedAt, setBoundaryUpdatedAt] = useState<number | null>(null);
  const [speechStartedAt, setSpeechStartedAt] = useState<number | null>(null);
  const [ttsCueStart, setTtsCueStart] = useState(0);
  const [ttsCueEnd, setTtsCueEnd] = useState(0);
  const [audioElapsed, setAudioElapsed] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioUpdatedAt, setAudioUpdatedAt] = useState<number | null>(null);
  const [completedKey, setCompletedKey] = useState<string | null>(null);
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
  const ttsStartGuardRef = useRef<number | null>(null);
  const playTokenRef = useRef(0);
  const pauseStartedRef = useRef<number | null>(null);

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

  // Load the voice list on the first user gesture. Speaking a silent utterance
  // here used to delay the real first sentence on Safari/iOS and some Chromium builds.
  const warmedRef = useRef(false);
  const warmup = useCallback(() => {
    if (!ttsSupported || warmedRef.current) return;
    warmedRef.current = true;
    try {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.resume();
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

  const clearTtsStartGuard = useCallback(() => {
    if (ttsStartGuardRef.current != null) {
      clearTimeout(ttsStartGuardRef.current);
      ttsStartGuardRef.current = null;
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
    playTokenRef.current += 1;
    clearKeepAlive();
    clearTtsStartGuard();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current.load();
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
    setTtsCueStart(0);
    setTtsCueEnd(0);
    pauseStartedRef.current = null;
    setBoundaryUpdatedAt(null);
    setAudioElapsed(0);
    setAudioDuration(null);
    setAudioUpdatedAt(null);
  }, [clearKeepAlive, clearTtsStartGuard, ttsSupported]);

  const speakTts = useCallback(
    (script: string, key: string) => {
      if (!ttsSupported) {
        setStatus('idle');
        setCompletedKey(key);
        return;
      }
      const synth = window.speechSynthesis;
      setStatus('loading');
      const token = playTokenRef.current;

      const doSpeak = () => {
        if (token !== playTokenRef.current) return;
        setAudioElapsed(0);
        setAudioDuration(null);
        setAudioUpdatedAt(null);
        setBoundaryUpdatedAt(null);
        const voice = pickPreferredVoice(voiceURI);
        const chunks = ttsChunks(script);
        const iosWebKit = isIOSWebKit();
        let activeAttempt = 0;

        const finish = () => {
          clearTtsStartGuard();
          clearKeepAlive();
          setSpeechStartedAt(null);
          setStatus('idle');
          setCompletedKey(key);
        };

        const speakChunk = (index: number, retry = 0) => {
          if (token !== playTokenRef.current) return;
          const chunk = chunks[index];
          if (!chunk) {
            finish();
            return;
          }

          activeAttempt += 1;
          const attempt = activeAttempt;
          let started = false;
          const u = new SpeechSynthesisUtterance(chunk.text);
          u.lang = 'ar-SA';
          u.rate = iosWebKit ? Math.min(rate, 1.08) : rate;
          u.pitch = 0.92;
          if (voice) u.voice = voice;
          u.onstart = () => {
            if (token !== playTokenRef.current || attempt !== activeAttempt) return;
            started = true;
            clearTtsStartGuard();
            setSource('tts');
            sourceRef.current = 'tts';
            setStatus('playing');
            setCharIndex(chunk.start);
            setTtsCueStart(chunk.start);
            setTtsCueEnd(chunk.end);
            setSpeechStartedAt(performance.now());
            setBoundaryUpdatedAt(null);
            if (index === 0) startKeepAlive();
          };
          u.onboundary = (e) => {
            if (token === playTokenRef.current && attempt === activeAttempt) {
              setCharIndex(Math.min(chunk.end, chunk.start + Math.max(0, e.charIndex ?? 0)));
              setBoundaryUpdatedAt(performance.now());
            }
          };
          u.onend = () => {
            if (token !== playTokenRef.current || attempt !== activeAttempt) return;
            clearTtsStartGuard();
            setCharIndex(chunk.end);
            if (index === chunks.length - 1) {
              finish();
            } else {
              speakChunk(index + 1);
            }
          };
          u.onerror = () => {
            if (token !== playTokenRef.current || attempt !== activeAttempt) return;
            clearTtsStartGuard();
            if (!started && retry < 2) {
              activeAttempt += 1;
              window.setTimeout(() => speakChunk(index, retry + 1), 40);
              return;
            }
            finish();
          };
          if (index === 0) utterRef.current = u;
          synth.resume();
          synth.speak(u);

          // Safari/iOS often reports `onstart` late. Cancelling after one second
          // restarts an utterance that is already warming up and causes the
          // audible first-word stutter this guard is meant to prevent.
          const guardDelay = iosWebKit
            ? retry === 0 ? 6000 : retry === 1 ? 9000 : 12000
            : retry === 0 ? 1800 : retry === 1 ? 2800 : 4200;
          ttsStartGuardRef.current = window.setTimeout(() => {
            if (token !== playTokenRef.current || attempt !== activeAttempt || started) return;
            activeAttempt += 1;
            synth.cancel();
            synth.resume();
            clearTtsStartGuard();
            if (retry < 2) {
              window.setTimeout(() => speakChunk(index, retry + 1), 40);
            } else {
              finish();
            }
          }, guardDelay);
        };

        speakChunk(0);
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
    [rate, voiceURI, ttsSupported, startKeepAlive, clearKeepAlive, clearTtsStartGuard],
  );

  const play = useCallback(
    (key: string, script: string) => {
      stopInternal();
      const token = playTokenRef.current;
      lastRef.current = { key, script };
      setCompletedKey(null);
      setCharIndex(0);
      setBoundaryUpdatedAt(null);
      setSpeechStartedAt(null);
      setTtsCueStart(0);
      setTtsCueEnd(0);
      setAudioElapsed(0);
      setAudioDuration(null);
      setAudioUpdatedAt(null);

      // No real MP3 for this key → go straight to TTS (instant, no probe delay).
      if (!hasAudio(key)) {
        speakTts(script, key);
        return;
      }

      setStatus('loading');
      const audio = preloadedAudio.get(key) ?? new Audio(`${base}audio/${key}.mp3`);
      preloadedAudio.delete(key);
      audio.preload = 'auto';
      audioRef.current = audio;
      let handledFallback = false;
      const fallback = () => {
        if (token !== playTokenRef.current) return;
        if (handledFallback) return;
        handledFallback = true;
        audioRef.current = null;
        speakTts(script, key);
      };
      const updateAudioTime = () => {
        if (token !== playTokenRef.current) return;
        setAudioElapsed(audio.currentTime || 0);
        setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : null);
        setAudioUpdatedAt(performance.now());
      };
      audio.addEventListener('loadedmetadata', updateAudioTime);
      audio.addEventListener('durationchange', updateAudioTime);
      audio.addEventListener('timeupdate', updateAudioTime);
      audio.addEventListener('playing', () => {
        if (token !== playTokenRef.current) {
          audio.pause();
          audio.src = '';
          return;
        }
        updateAudioTime();
        setSource('audio');
        sourceRef.current = 'audio';
        setStatus('playing');
        setSpeechStartedAt(performance.now());
      });
      audio.addEventListener('ended', () => {
        if (token !== playTokenRef.current) return;
        setAudioElapsed(Number.isFinite(audio.duration) ? audio.duration : audio.currentTime || 0);
        setAudioDuration(Number.isFinite(audio.duration) ? audio.duration : null);
        setAudioUpdatedAt(performance.now());
        setSpeechStartedAt(null);
        setStatus('idle');
        setCompletedKey(key);
      });
      audio.addEventListener('error', fallback);
      audio.play().catch(() => {
        if (token !== playTokenRef.current) return;
        // If the browser blocks autoplay for an existing MP3, do not fall back
        // to device TTS; that would change Shakir's fixed voice on mobile.
        setStatus('idle');
        setSource(null);
        sourceRef.current = null;
        setSpeechStartedAt(null);
        setAudioElapsed(0);
        setAudioDuration(null);
        setAudioUpdatedAt(null);
        setCompletedKey(key);
      });
    },
    [speakTts, stopInternal],
  );

  const pause = useCallback(() => {
    if (sourceRef.current === 'audio' && audioRef.current) {
      setAudioElapsed(audioRef.current.currentTime || 0);
      setAudioUpdatedAt(performance.now());
      audioRef.current.pause();
      setStatus('paused');
    } else if (sourceRef.current === 'tts' && ttsSupported) {
      clearKeepAlive();
      pauseStartedRef.current = performance.now();
      window.speechSynthesis.pause();
      setStatus('paused');
    }
  }, [clearKeepAlive, ttsSupported]);

  const resume = useCallback(() => {
    if (sourceRef.current === 'audio' && audioRef.current) {
      setAudioElapsed(audioRef.current.currentTime || 0);
      setAudioDuration(Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : null);
      setAudioUpdatedAt(performance.now());
      audioRef.current.play().catch(() => undefined);
      setSpeechStartedAt(performance.now());
      setStatus('playing');
    } else if (sourceRef.current === 'tts' && ttsSupported) {
      const resumedAt = performance.now();
      const pausedFor = pauseStartedRef.current == null ? 0 : resumedAt - pauseStartedRef.current;
      setSpeechStartedAt((startedAt) => startedAt == null ? resumedAt : startedAt + pausedFor);
      pauseStartedRef.current = null;
      window.speechSynthesis.resume();
      startKeepAlive();
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

  const getAudioClock = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || sourceRef.current !== 'audio') return null;
    return {
      elapsed: audio.currentTime || 0,
      duration: Number.isFinite(audio.duration) ? audio.duration : null,
      paused: audio.paused,
    };
  }, []);

  useEffect(() => () => stopInternal(), [stopInternal]);

  return {
    status,
    source,
    isPlaying: status === 'playing',
    isLoading: status === 'loading',
    isPaused: status === 'paused',
    charIndex,
    boundaryUpdatedAt,
    speechStartedAt,
    ttsCueStart,
    ttsCueEnd,
    audioElapsed,
    audioDuration,
    audioUpdatedAt,
    getAudioClock,
    completedKey,
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
