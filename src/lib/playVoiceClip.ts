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
const activeClips = new Set<HTMLAudioElement>();

function silenceAudio(audio: HTMLAudioElement) {
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.src = '';
    audio.load();
  } catch {
    /* best-effort cleanup for detached browser audio objects */
  }
}

export function stopVoiceClip() {
  const audio = current;
  const cancel = currentCancel;
  current = null;
  currentFinish = null;
  currentCancel = null;
  cancel?.();
  if (audio) silenceAudio(audio);
  for (const clip of [...activeClips]) {
    if (clip !== audio) silenceAudio(clip);
    activeClips.delete(clip);
  }
}

export function playVoiceClip(key: string | undefined) {
  if (!key || !hasAudio(key)) return Promise.resolve();
  stopVoiceClip();
  const base = import.meta.env.BASE_URL || '/';
  const audio = new Audio(`${base}audio/${key}.mp3?v=${AUDIO_MANIFEST_VERSION}`);
  current = audio;
  activeClips.add(audio);
  return new Promise<void>((resolve, reject) => {
    const finish = () => {
      activeClips.delete(audio);
      if (current === audio) current = null;
      if (currentFinish === finish) currentFinish = null;
      if (currentCancel === cancel) currentCancel = null;
      resolve();
    };
    const cancel = () => {
      activeClips.delete(audio);
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
