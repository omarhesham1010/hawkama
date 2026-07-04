import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from './hooks/useProgress';
import { useVoiceSync } from './hooks/useVoiceSync';
import { useNarrationContext } from './components/audio/NarrationContext';
import { slides, courseMeta } from './data/slides';

import { BackgroundDecor } from './components/course/BackgroundDecor';
import { PlayerHeader } from './components/player/PlayerHeader';
import { PlayerControls } from './components/player/PlayerControls';
import { SlideMenu } from './components/player/SlideMenu';
import { SlideStage } from './components/player/SlideStage';
import { SlideCanvas } from './components/player/SlideCanvas';
import { CaptionBar } from './components/player/CaptionBar';
import { HelpOverlay } from './components/player/HelpOverlay';

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
  initialSlide = 1,
  onExit,
}: {
  initialSlide?: number;
  onExit: () => void;
}) {
  const progress = useProgress(slides.length);
  const narration = useNarrationContext();

  const clampedStart = Math.max(0, Math.min(initialSlide - 1, slides.length - 1));
  const [index, setIndex] = useState(clampedStart);
  const [started, setStarted] = useState(clampedStart > 0);
  const [muted, setMuted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [replayNonce, setReplayNonce] = useState(0);
  const skipNextAutoPlayRef = useRef(false);

  useEffect(() => {
    window.history.replaceState(null, '', `#/course/${index + 1}`);
  }, [index]);

  const slide = slides[index];
  const armed = started && !muted;
  const sync = useVoiceSync(slide.narration.length, slide.audioKey, armed, `${slide.id}#${replayNonce}`);

  const totalActivities = useMemo(() => slides.filter((s) => s.kind === 'activity').length, []);

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
  const showDialogue =
    voicePlaying && narration.nowKey === slide.audioKey && sync.spoken < slide.narration.length;

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
    setMuted((prev) => {
      const next = !prev;
      if (next) narration.stop();
      else {
        setReplayNonce((n) => n + 1);
        narration.play(slide.audioKey, slide.narration, slide.title);
      }
      return next;
    });
  }, [narration, slide]);

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

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
      <BackgroundDecor />

      <PlayerHeader
        courseTitle={`${courseMeta.title} · ${courseMeta.chapter}`}
        slideTitle={slide.title}
        sectionLabel={SECTION_LABEL[slide.kind] ?? 'شرح مصوّر'}
        index={index}
        total={slides.length}
        onExit={exit}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Fixed 16:9 stage — scales to fit, never scrolls */}
      <main className="relative min-h-0 flex-1 overflow-hidden px-3 py-3 sm:px-6 sm:py-4">
        <div key={slide.id} className="h-full animate-fade-in">
          <SlideCanvas>
            <SlideStage
              slide={slide}
              spoken={sync.spoken}
              started={started}
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

      <CaptionBar text={slide.narration} audioKey={slide.audioKey} />

      <PlayerControls
        index={index}
        total={slides.length}
        onPrev={() => goTo(index - 1)}
        onNext={() => goTo(index + 1)}
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
