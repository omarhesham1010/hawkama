import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNarration } from '../../hooks/useNarration';

interface NarrationContextValue {
  status: ReturnType<typeof useNarration>['status'];
  source: ReturnType<typeof useNarration>['source'];
  isPlaying: boolean;
  isLoading: boolean;
  isPaused: boolean;
  charIndex: number;
  boundaryUpdatedAt: number | null;
  speechStartedAt: number | null;
  ttsCueStart: number;
  ttsCueEnd: number;
  audioElapsed: number;
  audioDuration: number | null;
  audioUpdatedAt: number | null;
  getAudioClock: ReturnType<typeof useNarration>['getAudioClock'];
  completedKey: string | null;
  ttsSupported: boolean;
  nowLabel: string | null;
  nowKey: string | null;
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
  setVoiceURI: (uri: string | null) => void;
  rate: number;
  setRate: (r: number) => void;
  play: (key: string, script: string, label?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  replay: () => void;
  warmup: () => void;
}

const Ctx = createContext<NarrationContextValue | null>(null);

export function NarrationProvider({ children }: { children: React.ReactNode }) {
  const n = useNarration();
  const [nowLabel, setNowLabel] = useState<string | null>(null);
  const [nowKey, setNowKey] = useState<string | null>(null);

  const play = useCallback(
    (key: string, script: string, label?: string) => {
      setNowLabel(label ?? null);
      setNowKey(key);
      n.play(key, script);
    },
    [n],
  );

  const stop = useCallback(() => {
    n.stop();
  }, [n]);

  const value = useMemo<NarrationContextValue>(
    () => ({
      status: n.status,
      source: n.source,
      isPlaying: n.isPlaying,
      isLoading: n.isLoading,
      isPaused: n.isPaused,
      charIndex: n.charIndex,
      boundaryUpdatedAt: n.boundaryUpdatedAt,
      speechStartedAt: n.speechStartedAt,
      ttsCueStart: n.ttsCueStart,
      ttsCueEnd: n.ttsCueEnd,
      audioElapsed: n.audioElapsed,
      audioDuration: n.audioDuration,
      audioUpdatedAt: n.audioUpdatedAt,
      getAudioClock: n.getAudioClock,
      completedKey: n.completedKey,
      ttsSupported: n.ttsSupported,
      nowLabel,
      nowKey,
      voices: n.voices,
      voiceURI: n.voiceURI,
      setVoiceURI: n.setVoiceURI,
      rate: n.rate,
      setRate: n.setRate,
      play,
      pause: n.pause,
      resume: n.resume,
      stop,
      replay: n.replay,
      warmup: n.warmup,
    }),
    [
      n.status,
      n.source,
      n.isPlaying,
      n.isLoading,
      n.isPaused,
      n.charIndex,
      n.boundaryUpdatedAt,
      n.speechStartedAt,
      n.ttsCueStart,
      n.ttsCueEnd,
      n.audioElapsed,
      n.audioDuration,
      n.audioUpdatedAt,
      n.getAudioClock,
      n.completedKey,
      n.ttsSupported,
      n.voices,
      n.voiceURI,
      n.setVoiceURI,
      n.rate,
      n.setRate,
      n.pause,
      n.resume,
      n.replay,
      n.warmup,
      nowLabel,
      nowKey,
      play,
      stop,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNarrationContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNarrationContext must be used within NarrationProvider');
  return ctx;
}
