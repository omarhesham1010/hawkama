import { useEffect } from 'react';
import { useSlidePlayerEngine } from '../../hooks/useSlidePlayerEngine';
import { SlideCanvas } from '../player/SlideCanvas';
import { SlideStage } from '../player/SlideStage';
import { toArabicDigits } from '../../lib/utils';

/** Bare presentation of the slide-deck engine for the course-2 shell: only
 *  the rectangular slide itself (no background decor, no top chrome/header)
 *  plus a separate control strip below it, styled to match the ministry
 *  LMS's green identity instead of the floating translucent pill used by
 *  the full SlidePlayer chrome. */
export function CourseTwoPlayer({
  courseId,
  initialSlide,
  onExit,
  onSlideChange,
  strictSequential = false,
  maxUnlockedIndex,
  onUnlockSlide,
  onResetSequentialLocks,
}: {
  courseId: string;
  initialSlide: number;
  onExit: () => void;
  onSlideChange?: (index: number) => void;
  strictSequential?: boolean;
  maxUnlockedIndex?: number;
  onUnlockSlide?: (slideId: string) => void;
  onResetSequentialLocks?: () => void;
}) {
  const {
    slides,
    slide,
    progress,
    narration,
    index,
    started,
    muted,
    replayNonce,
    sync,
    showDialogue,
    voicePlaying,
    totalActivities,
    goTo,
    start,
    handlePlayPause,
    handleReplay,
    toggleMute,
    restartCourse,
    exit,
  } = useSlidePlayerEngine({ courseId, initialSlide, onExit, syncUrl: false, onSlideChange });

  const sequentialLocked = strictSequential;
  const nextUnlocked = !sequentialLocked || index < (maxUnlockedIndex ?? 0);
  const canGoNext = index < slides.length - 1 && nextUnlocked;
  const unlockCurrentSlide = () => onUnlockSlide?.(slide.id);

  useEffect(() => {
    if (!sequentialLocked) return;
    if (slide.kind === 'activity' || slide.kind === 'quiz') return;
    if (narration.completedKey !== slide.audioKey) return;
    unlockCurrentSlide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequentialLocked, narration.completedKey, slide.audioKey, slide.id, slide.kind]);

  const restartWithLocks = () => {
    onResetSequentialLocks?.();
    restartCourse();
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="min-h-0 flex-1">
        <div key={`${slide.id}#${replayNonce}`} className="h-full w-full animate-fade-in">
          <SlideCanvas variant={slide.kind === 'welcome' ? 'intro' : 'default'}>
            <SlideStage
              slide={slide}
              courseId={courseId}
              spoken={sync.spoken}
              started={started}
              muted={muted}
              showDialogue={showDialogue}
              onStart={start}
              onActivityDone={(id) => {
                progress.markActivityDone(id);
                if (sequentialLocked) onUnlockSlide?.(id);
              }}
              onQuizComplete={(score) => {
                progress.setQuizScore(score);
                progress.markComplete(slide.id);
                if (sequentialLocked) unlockCurrentSlide();
              }}
              completion={{
                percent: Math.round(((index + 1) / slides.length) * 100),
                quizScore: progress.state.quizScore,
                activitiesDone: progress.state.activitiesDone.filter((id) =>
                  slides.some((s) => s.id === id && s.kind === 'activity'),
                ).length,
                totalActivities,
                onRestart: restartWithLocks,
                onExit: exit,
              }}
            />
          </SlideCanvas>
        </div>
      </div>

      {/* Separate control strip -- not overlaid on the slide -- in the
          ministry LMS's green identity. */}
      <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-brand px-3 py-2 shadow-card">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="الشريحة السابقة"
          title="الشريحة السابقة"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handlePlayPause}
          aria-label={voicePlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          title={voicePlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white shadow-card"
        >
          {narration.isLoading ? (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : voicePlaying ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={handleReplay}
          aria-label="إعادة الشريحة"
          title="إعادة الشريحة"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-85"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 3v4h4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-85"
        >
          {muted ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9z" />
              <path d="M17 9l4 6M21 9l-4 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9z" />
              <path d="M16 9a4 4 0 010 6" />
            </svg>
          )}
        </button>

        <div className="mx-1 flex min-w-0 flex-1 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-200 ease-linear"
              style={{ width: `${Math.round(sync.progress * 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-semibold text-white/90 tabular">
            {toArabicDigits(index + 1)} / {toArabicDigits(slides.length)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (canGoNext) goTo(index + 1);
          }}
          disabled={!canGoNext}
          aria-label="الشريحة التالية"
          title={canGoNext ? 'الشريحة التالية' : 'أكمل الشريحة الحالية أولًا'}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
