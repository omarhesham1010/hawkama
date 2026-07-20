import { AUDIO_MANIFEST_VERSION, hasAudio } from '../data/audioManifest';

// Short pre-recorded reaction/feedback lines (activity answers, flipped
// cards) play through their own throwaway <audio> element instead of the
// shared NarrationContext -- that context is mid-pause on the slide's main
// narration track while an activity checkpoint is open, and routing a
// feedback clip through the same `play()` would tear down and replace that
// paused track, leaving nothing for `resume()` to continue afterward.
let current: HTMLAudioElement | null = null;
let currentFinish: (() => void) | null = null;
let currentCancel: (() => void) | null = null;

export function stopVoiceClip() {
  if (!current) return;
  currentCancel?.();
  current.pause();
  current.src = '';
  current = null;
  currentFinish = null;
  currentCancel = null;
}

export function playVoiceClip(key: string | undefined) {
  if (!key || !hasAudio(key)) return Promise.resolve();
  stopVoiceClip();
  const base = import.meta.env.BASE_URL || '/';
  const audio = new Audio(`${base}audio/${key}.mp3?v=${AUDIO_MANIFEST_VERSION}`);
  current = audio;
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (current === audio) current = null;
      if (currentFinish === finish) currentFinish = null;
      if (currentCancel === cancel) currentCancel = null;
      resolve();
    };
    const cancel = () => {
      if (current === audio) current = null;
      if (currentFinish === finish) currentFinish = null;
      if (currentCancel === cancel) currentCancel = null;
      reject(new DOMException('Voice clip cancelled', 'AbortError'));
    };
    currentFinish = finish;
    currentCancel = cancel;
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    audio.play().catch(finish);
  });
}
