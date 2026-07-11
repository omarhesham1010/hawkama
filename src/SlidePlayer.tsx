import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from './hooks/useProgress';
import { useVoiceSync } from './hooks/useVoiceSync';
import { useNarrationContext } from './components/audio/NarrationContext';
import { getCourseMeta, getSlidesForCourse } from './data/slides';
import { courseHash } from './lib/courseRoutes';
import { preloadNarrationAudio } from './hooks/useNarration';

import { BackgroundDecor } from './components/course/BackgroundDecor';
import { PlayerHeader } from './components/player/PlayerHeader';
import { PlayerControls } from './components/player/PlayerControls';
import { SlideMenu } from './components/player/SlideMenu';
import { SlideStage } from './components/player/SlideStage';
import { SlideCanvas } from './components/player/SlideCanvas';
import { CaptionBar } from './components/player/CaptionBar';
import { HelpOverlay } from './components/player/HelpOverlay';
import { Icon } from './components/ui/Icon';

const SECTION_LABEL: Record<string, string> = {
  welcome: 'مقدمة الوحدة',
  content: 'شرح مصوّر',
  activity: 'نشاط تدريبي',
  quiz: 'اختبار المعرفة',
  reflection: 'وقفة تأمّل',
  completion: 'إتمام الوحدة',
};

/** Articulate-Storyline-style narrated slide player (voice-synced reveal). */
export default function SlidePlayer({
  courseId = 'governance-intro',
  initialSlide = 1,
  onExit,
}: {
  courseId?: string;
  initialSlide?: number;
  onExit: () => void;
}) {
  const slides = useMemo(() => getSlidesForCourse(courseId), [courseId]);
  const courseMeta = useMemo(() => getCourseMeta(courseId), [courseId]);
  const progress = useProgress(slides.length, courseId);
  const narration = useNarrationContext();

  const clampedStart = Math.max(0, Math.min(initialSlide - 1, slides.length - 1));
  // A deep link straight into the middle of a course would otherwise try to
  // autoplay narration from a plain useEffect on mount, with no preceding
  // user gesture — mobile Safari/Chrome silently block that (the audio
  // "completes" instantly without ever making a sound). Gate that one case
  // behind a single tap, which becomes the gesture that unlocks audio for
  // the rest of the session; a normal course entry (starts at slide 1, the
  // "ابدأ الفصل" button click) already provides that gesture itself.
  const [needsGesture, setNeedsGesture] = useState(clampedStart > 0);
  const [index, setIndex] = useState(clampedStart);
  // Both entry paths now wait for a real tap before narration starts: slide
  // 1 already shows its own "ابدأ الفصل" button (unaffected by this change),
  // and a deep link past slide 1 shows the gesture gate below instead.
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [replayNonce, setReplayNonce] = useState(0);
  const [dialogueHolding, setDialogueHolding] = useState(false);
  const skipNextAutoPlayRef = useRef(false);

  useEffect(() => {
    window.history.replaceState(null, '', courseHash(courseId, index + 1));
  }, [courseId, index]);

  const slide = slides[index];
  const armed = started && !muted;
  const sync = useVoiceSync(slide.narration, slide.audioKey, armed, `${slide.id}#${replayNonce}`);

  const totalActivities = useMemo(() => slides.filter((s) => s.kind === 'activity').length, [slides]);

  useEffect(() => {
    preloadNarrationAudio(slide.audioKey);
    const nextSlide = slides[index + 1];
    if (nextSlide) preloadNarrationAudio(nextSlide.audioKey);
  }, [index, slide.audioKey, slides]);

  useEffect(() => {
    setIndex(Math.max(0, Math.min(initialSlide - 1, slides.length - 1)));
  }, [initialSlide, slides.length]);

  const playNarration = useCallback(() => {
    if (!muted) {
      narration.warmup();
      narration.play(slide.audioKey, slide.narration, slide.title);
    }
  }, [muted, narration, slide]);

  // On each slide (once started) → narrate; reveal follows the voice.
  useEffect(() => {
    if (!started) return;
    if (skipNextAutoPlayRef.current) {
      skipNextAutoPlayRef.current = false;
    } else {
      playNarration();
    }
    progress.markComplete(slide.id);
    progress.setLastSection(slide.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, started]);

  const goTo = useCallback((i: number) => {
    narration.stop();
    setIndex(Math.max(0, Math.min(i, slides.length - 1)));
  }, [narration]);

  const start = useCallback(() => {
    narration.warmup();
    skipNextAutoPlayRef.current = true;
    setStarted(true);
    setReplayNonce((n) => n + 1);
    playNarration();
    progress.markComplete(slide.id);
    progress.setLastSection(slide.id);
  }, [narration, playNarration, progress, slide]);

  const startFromGesture = useCallback(() => {
    setNeedsGesture(false);
    start();
  }, [start]);

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
    if (!muted) playNarration();
    else narration.stop();
  }, [muted, narration, playNarration]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    if (next) narration.stop();
    else {
      setReplayNonce((n) => n + 1);
      narration.play(slide.audioKey, slide.narration, slide.title);
    }
  }, [muted, narration, slide]);

  const restartCourse = useCallback(() => {
    progress.reset();
    narration.stop();
    setStarted(false);
    setIndex(0);
  }, [narration, progress]);

  const exit = useCallback(() => {
    narration.stop();
    onExit();
  }, [narration, onExit]);

  const sourceLabel = voicePlaying ? (narration.source === 'audio' ? 'ملف صوتي' : 'قراءة صوتية') : null;
  const displaySlideTitle = slide.id === 'program-map' ? 'محتويات الحقيبة الأولى' : slide.title;

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
      <BackgroundDecor />

      <PlayerHeader
        courseTitle={`${courseMeta.title} · ${courseMeta.chapter}`}
        slideTitle={displaySlideTitle}
        sectionLabel={SECTION_LABEL[slide.kind] ?? 'شرح مصوّر'}
        index={index}
        total={slides.length}
        onExit={exit}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Fixed 16:9 stage — scales to fit, never scrolls */}
      <main className="player-main relative min-h-0 flex-1 overflow-hidden px-3 py-3 sm:px-6 sm:py-4">
        {needsGesture && (
          <button
            type="button"
            onClick={startFromGesture}
            className="absolute inset-0 z-40 grid place-items-center bg-ink/45 backdrop-blur-sm"
          >
            <span className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-card-lg">
              <Icon name="sound" className="h-8 w-8 text-brand" />
              <span className="text-lg font-extrabold text-brand-strong">اضغط للمتابعة وتشغيل الشرح الصوتي</span>
            </span>
          </button>
        )}
        <div key={`${slide.id}#${replayNonce}`} className="h-full animate-fade-in">
          <SlideCanvas>
            <SlideStage
              slide={slide}
              spoken={sync.spoken}
              started={started}
              muted={muted}
              showDialogue={showDialogue}
              onStart={start}
              onActivityDone={(id) => progress.markActivityDone(id)}
              onQuizComplete={(score) => {
                progress.setQuizScore(score);
                progress.markComplete(slide.id);
              }}
              completion={{
                percent: Math.round(((index + 1) / slides.length) * 100),
                quizScore: progress.state.quizScore,
                activitiesDone: progress.state.activitiesDone.filter((id) =>
                  slides.some((s) => s.id === id && s.kind === 'activity'),
                ).length,
                totalActivities,
                onRestart: restartCourse,
                onExit: exit,
              }}
            />
          </SlideCanvas>
        </div>
      </main>

      {/* The closing screen's exit/restart buttons live inside the fixed
          16:9 canvas, so on a narrow phone they shrink down with everything
          else and become too small to tap reliably. This duplicates them at
          a real, always-tappable size — mobile only, canvas design untouched. */}
      {(slide.kind === 'completion' || slide.layout === 'pptConclusion') && (
        <div className="flex shrink-0 items-center justify-center gap-3 px-4 pb-2 sm:hidden">
          <button type="button" onClick={exit} className="btn-gold min-h-[48px] flex-1 max-w-[220px] justify-center text-[15px]">
            <Icon name="flag" className="h-5 w-5" />
            إنهاء والعودة للمنصة
          </button>
          <button type="button" onClick={restartCourse} className="btn-ghost min-h-[48px] flex-1 max-w-[220px] justify-center text-[15px]">
            <Icon name="flow" className="h-5 w-5" />
            إعادة الفصل
          </button>
        </div>
      )}

      <CaptionBar text={slide.narration} audioKey={slide.audioKey} spoken={sync.spoken} />

      <PlayerControls
        index={index}
        total={slides.length}
        onPrev={() => goTo(index - 1)}
        onNext={() => (index === slides.length - 1 ? exit() : goTo(index + 1))}
        onPlayPause={handlePlayPause}
        onReplay={handleReplay}
        onToggleMute={toggleMute}
        muted={muted}
        isPlaying={voicePlaying}
        isLoading={narration.isLoading}
        progress={sync.progress}
        sourceLabel={sourceLabel}
      />

      <SlideMenu
        slides={slides}
        current={index}
        visited={progress.isComplete}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onJump={goTo}
      />

      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
