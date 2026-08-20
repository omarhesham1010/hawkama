import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from './useProgress';
import { useVoiceSync } from './useVoiceSync';
import { useNarrationContext } from '../components/audio/NarrationContext';
import { getCourseMeta, getSlidesForCourse } from '../data/slides';
import { courseHash } from '../lib/courseRoutes';
import { keepOnlyPreloadedNarrationAudio, preloadNarrationAudio } from './useNarration';
import { stopVoiceClip } from '../lib/playVoiceClip';

/** The narrated-slide-deck state machine shared by every presentation of a
 *  course: which slide is showing, whether narration has started/is muted,
 *  voice-sync progress, and all the play/pause/next/prev/replay/mute/exit
 *  handlers. Extracted out of SlidePlayer so a second, differently-chromed
 *  presentation (the course-2 bare-slide shell) can drive the exact same
 *  engine without re-implementing (and risking drifting from) this logic. */
export function useSlidePlayerEngine({
  courseId = 'governance-intro',
  initialSlide = 1,
  onExit,
  syncUrl = true,
  onSlideChange,
}: {
  courseId?: string;
  initialSlide?: number;
  onExit: () => void;
  syncUrl?: boolean;
  onSlideChange?: (index: number) => void;
}) {
  const slides = useMemo(() => getSlidesForCourse(courseId), [courseId]);
  const courseMeta = useMemo(() => getCourseMeta(courseId), [courseId]);
  const progress = useProgress(slides.length, courseId);
  const narration = useNarrationContext();

  const clampedStart = Math.max(0, Math.min(initialSlide - 1, slides.length - 1));
  const [index, setIndex] = useState(clampedStart);
  // Narration never autoplays on load/refresh, regardless of which slide a
  // link lands on — the learner presses play (on the slide's own button or
  // the player controls) whenever they actually want to hear it.
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [replayNonce, setReplayNonce] = useState(0);
  const [dialogueHolding, setDialogueHolding] = useState(false);
  const skipNextAutoPlayRef = useRef(false);

  useEffect(() => {
    if (syncUrl) window.history.replaceState(null, '', courseHash(courseId, index + 1));
    onSlideChange?.(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, index, syncUrl]);

  const slide = slides[index];
  const armed = started && !muted;
  const sync = useVoiceSync(slide.narration, slide.audioKey, armed, `${slide.id}#${replayNonce}`, muted);

  const totalActivities = useMemo(() => slides.filter((s) => s.kind === 'activity').length, [slides]);

  useEffect(() => {
    preloadNarrationAudio(slide.audioKey);
    keepOnlyPreloadedNarrationAudio([slide.audioKey]);
  }, [index, slide.audioKey, slides]);

  useEffect(() => {
    if (!narration.isPlaying || narration.nowKey !== slide.audioKey) return;
    const nextSlide = slides[index + 1];
    if (!nextSlide) return;
    const timer = window.setTimeout(() => {
      preloadNarrationAudio(nextSlide.audioKey, 'metadata');
      keepOnlyPreloadedNarrationAudio([slide.audioKey, nextSlide.audioKey]);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [index, narration.isPlaying, narration.nowKey, slide.audioKey, slides]);

  useEffect(() => {
    setIndex(Math.max(0, Math.min(initialSlide - 1, slides.length - 1)));
  }, [initialSlide, slides.length]);

  // Sidebar "jump to any slide" navigation (every course shell) remounts
  // this whole engine instance via a React `key` bump instead of calling
  // `goTo` -- so the explicit `narration.stop()` inside `goTo` never runs
  // for that path, and Nasser's old narration kept playing over the newly
  // mounted slide. `narration`/NarrationContext lives above this component
  // in the tree and outlives the remount, so only an unmount cleanup here
  // can reliably catch every way this engine instance goes away (sidebar
  // jump, exit, course switch), not just the in-place navigation handlers.
  useEffect(() => {
    return () => {
      narration.stop();
      stopVoiceClip();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playNarration = useCallback(() => {
    if (!muted) {
      narration.warmup();
      narration.play(slide.audioKey, slide.narration, slide.title);
    }
  }, [muted, narration, slide]);

  // On each slide (once started) → narrate; reveal follows the voice.
  useEffect(() => {
    if (!started) return;
    stopVoiceClip();
    if (skipNextAutoPlayRef.current) {
      skipNextAutoPlayRef.current = false;
    } else {
      playNarration();
    }
    progress.markComplete(slide.id);
    progress.setLastSection(slide.id);
    return () => stopVoiceClip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, started]);

  const goTo = useCallback((i: number) => {
    narration.stop();
    stopVoiceClip();
    setIndex(Math.max(0, Math.min(i, slides.length - 1)));
  }, [narration, slides.length]);

  const start = useCallback(() => {
    narration.warmup();
    skipNextAutoPlayRef.current = true;
    setStarted(true);
    setReplayNonce((n) => n + 1);
    playNarration();
    progress.markComplete(slide.id);
    progress.setLastSection(slide.id);
  }, [narration, playNarration, progress, slide]);

  const voicePlaying = narration.isPlaying;
  const voicePaused = narration.isPaused;
  useEffect(() => {
    setDialogueHolding(false);
    if (narration.completedKey !== slide.audioKey || sync.spoken < slide.narration.length - 1) return;
    setDialogueHolding(true);
    const timer = window.setTimeout(() => setDialogueHolding(false), 1500);
    return () => window.clearTimeout(timer);
  }, [index, narration.completedKey, replayNonce, slide.audioKey, slide.narration.length, sync.spoken]);

  const showDialogue =
    narration.nowKey === slide.audioKey && sync.spoken > 1 &&
    ((voicePlaying && sync.spoken < slide.narration.length) || dialogueHolding);

  const handlePlayPause = useCallback(() => {
    if (!started) {
      narration.warmup();
      skipNextAutoPlayRef.current = true;
      setStarted(true);
      setReplayNonce((n) => n + 1);
      playNarration();
      progress.markComplete(slide.id);
      progress.setLastSection(slide.id);
      return;
    }
    if (voicePlaying) narration.pause();
    else if (voicePaused) narration.resume();
    else {
      setReplayNonce((n) => n + 1);
      playNarration();
    }
  }, [narration, playNarration, progress, slide, started, voicePaused, voicePlaying]);

  const handleReplay = useCallback(() => {
    setReplayNonce((n) => n + 1);
    stopVoiceClip();
    if (!muted) playNarration();
    else narration.stop();
  }, [muted, narration, playNarration]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    stopVoiceClip();
    if (next) narration.stop();
    else {
      setReplayNonce((n) => n + 1);
      narration.play(slide.audioKey, slide.narration, slide.title);
    }
  }, [muted, narration, slide]);

  const restartCourse = useCallback(() => {
    progress.reset();
    narration.stop();
    stopVoiceClip();
    setStarted(false);
    setIndex(0);
  }, [narration, progress]);

  const exit = useCallback(() => {
    narration.stop();
    stopVoiceClip();
    onExit();
  }, [narration, onExit]);

  const displaySlideTitle = slide.id === 'program-map' ? 'محتويات الحقيبة' : slide.title;

  return {
    slides,
    slide,
    courseMeta,
    progress,
    narration,
    index,
    started,
    muted,
    replayNonce,
    sync,
    showDialogue,
    voicePlaying,
    voicePaused,
    totalActivities,
    displaySlideTitle,
    goTo,
    start,
    handlePlayPause,
    handleReplay,
    toggleMute,
    restartCourse,
    exit,
  };
}
