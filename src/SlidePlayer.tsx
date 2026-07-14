import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from './hooks/useProgress';
import { useVoiceSync } from './hooks/useVoiceSync';
import { useNarrationContext } from './components/audio/NarrationContext';
import { getCourseMeta, getSlidesForCourse } from './data/slides';
import { courseHash } from './lib/courseRoutes';
import { keepOnlyPreloadedNarrationAudio, preloadNarrationAudio } from './hooks/useNarration';

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
  const [index, setIndex] = useState(clampedStart);
  // Narration never autoplays on load/refresh, regardless of which slide a
  // link lands on — the learner presses play (on the slide's own button or
  // the player controls) whenever they actually want to hear it.
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [replayNonce, setReplayNonce] = useState(0);
  const [dialogueHolding, setDialogueHolding] = useState(false);
  const skipNextAutoPlayRef = useRef(false);

  // Header/footer are overlays, not permanent layout rows -- the page's real
  // footprint is only the 16:9 body rectangle (LMS embeds size the iframe to
  // that box). Chrome slides in on hover-near-edge / the toggle button, and
  // auto-hides shortly after load or when the learner interacts with the
  // slide itself.
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeHideTimer = useRef<number | null>(null);
  const clearChromeHideTimer = useCallback(() => {
    if (chromeHideTimer.current !== null) {
      window.clearTimeout(chromeHideTimer.current);
      chromeHideTimer.current = null;
    }
  }, []);
  const showChrome = useCallback(() => {
    clearChromeHideTimer();
    setChromeVisible(true);
  }, [clearChromeHideTimer]);
  const scheduleHideChrome = useCallback((delay = 550) => {
    clearChromeHideTimer();
    chromeHideTimer.current = window.setTimeout(() => setChromeVisible(false), delay);
  }, [clearChromeHideTimer]);
  const hideChromeNow = useCallback(() => {
    clearChromeHideTimer();
    setChromeVisible(false);
  }, [clearChromeHideTimer]);
  const toggleChrome = useCallback(() => {
    if (chromeVisible) hideChromeNow();
    else showChrome();
  }, [chromeVisible, hideChromeNow, showChrome]);
  useEffect(() => {
    // Give first-time visitors a brief glimpse of the controls, then tuck
    // them away so the body stays the only permanent on-screen footprint.
    scheduleHideChrome(2600);
    return clearChromeHideTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.history.replaceState(null, '', courseHash(courseId, index + 1));
  }, [courseId, index]);

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
      preloadNarrationAudio(nextSlide.audioKey);
      keepOnlyPreloadedNarrationAudio([slide.audioKey, nextSlide.audioKey]);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [index, narration.isPlaying, narration.nowKey, slide.audioKey, slides]);

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
  const displaySlideTitle = slide.id === 'program-map' ? 'محتويات الحقيبة' : slide.title;

  return (
    <div className="relative h-[100dvh] overflow-hidden">
      <BackgroundDecor />

      {/* Body — the only permanent-footprint region. Header/footer overlay
          on top of it instead of pushing it, so the LMS iframe only ever
          needs to fit this 16:9 rectangle. */}
      <main
        className="player-main absolute inset-0 flex items-center justify-center overflow-hidden p-2 sm:p-3"
        onClick={() => chromeVisible && hideChromeNow()}
      >
        <div key={`${slide.id}#${replayNonce}`} className="h-full w-full animate-fade-in">
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

      {/* Hover-near-edge hot zones (desktop mouse) — reveal chrome without
          needing the toggle button. Harmless no-ops on touch. */}
      <div
        className="absolute inset-x-0 top-0 z-30 h-6"
        onMouseEnter={showChrome}
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 z-30 h-6"
        onMouseEnter={showChrome}
        aria-hidden="true"
      />

      {/* Single toggle — always reachable, on every device, for showing or
          collapsing both the header and footer chrome together. */}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          toggleChrome();
        }}
        aria-label={chromeVisible ? 'إخفاء عناصر التحكم' : 'إظهار عناصر التحكم'}
        title={chromeVisible ? 'إخفاء عناصر التحكم' : 'إظهار عناصر التحكم'}
        className="absolute left-1/2 top-1.5 z-50 flex h-6 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-black/25 text-white/90 shadow-card backdrop-blur-sm transition-all hover:bg-black/40"
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform duration-300 ${chromeVisible ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Header overlay */}
      <div
        className={`absolute inset-x-0 top-0 z-40 transition-all duration-300 ease-out ${
          chromeVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
        onMouseEnter={showChrome}
        onMouseLeave={() => scheduleHideChrome()}
      >
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
      </div>

      {/* Footer overlay — caption + playback controls together */}
      <div
        className={`absolute inset-x-0 bottom-0 z-40 transition-all duration-300 ease-out ${
          chromeVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        onMouseEnter={showChrome}
        onMouseLeave={() => scheduleHideChrome()}
      >
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
      </div>

      {/* The closing screen's exit/restart buttons live inside the fixed
          16:9 canvas, so on a narrow phone they shrink down with everything
          else and become too small to tap reliably. This duplicates them at
          a real, always-tappable size — mobile only, canvas design untouched.
          Kept above the footer overlay so it's reachable even while chrome
          is tucked away. */}
      {(slide.kind === 'completion' || slide.layout === 'pptConclusion') && (
        <div className="absolute inset-x-0 bottom-2 z-[45] flex items-center justify-center gap-3 px-4 sm:hidden">
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
