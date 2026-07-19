import { AUDIO_MANIFEST_VERSION, hasAudio } from '../data/audioManifest';

// Short pre-recorded reaction/feedback lines (activity answers, flipped
// cards) play through their own throwaway <audio> element instead of the
// shared NarrationContext -- that context is mid-pause on the slide's main
// narration track while an activity checkpoint is open, and routing a
// feedback clip through the same `play()` would tear down and replace that
// paused track, leaving nothing for `resume()` to continue afterward.
let current: HTMLAudioElement | null = null;

export function playVoiceClip(key: string | undefined) {
  if (!key || !hasAudio(key)) return;
  if (current) {
    current.pause();
    current.src = '';
  }
  const base = import.meta.env.BASE_URL || '/';
  const audio = new Audio(`${base}audio/${key}.mp3?v=${AUDIO_MANIFEST_VERSION}`);
  current = audio;
  audio.play().catch(() => undefined);
}
