import { useEffect } from 'react';
import type { Track } from '../../data/platformContent';
import type { ChapterProgress } from '../../lib/progressReader';
import { Icon } from '../ui/Icon';
import { ProgressBar } from '../layout/ProgressTracker';
import { toArabicDigits } from '../../lib/utils';
import { readChapterProgress } from '../../lib/progressReader';

export function TrackModal({
  track,
  progress,
  onClose,
  onEnterChapter,
}: {
  track: Track;
  progress: ChapterProgress;
  onClose: () => void;
  onEnterChapter: (courseId: string) => void;
}) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-green-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-card-lg animate-fade-up sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-line bg-gradient-to-l from-green-700 to-green-600 p-5 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/95 font-extrabold text-green-800 tabular">
            {toArabicDigits(track.index)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold">{track.title}</h3>
            <p className="truncate text-sm text-green-50/90">{track.short}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white hover:bg-white/25"
            aria-label="إغلاق"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Course units */}
        <div className="scroll-slim flex-1 space-y-2.5 overflow-y-auto p-5">
          <p className="mb-1 text-sm font-bold text-ink-soft">
            محتويات الحقيبة ({toArabicDigits(track.chapters.length)})
          </p>
          {track.chapters.map((ch) => {
            const ready = ch.status === 'ready';
            const chapterProgress = ch.courseId ? readChapterProgress(ch.courseId) : progress;
            return (
              <div
                key={ch.index}
                className={`flex items-center gap-3 rounded-xl border p-3.5 ${
                  ready ? 'border-green-500/40 bg-green-500/[0.06]' : 'border-line bg-surface-2'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold tabular ${
                    ready ? 'bg-green-600 text-white' : 'bg-surface-3 text-ink-muted'
                  }`}
                >
                  {ready ? toArabicDigits(ch.index) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="5" y="11" width="14" height="9" rx="2" />
                      <path d="M8 11V8a4 4 0 118 0v3" />
                    </svg>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${ready ? 'text-ink' : 'text-ink-muted'}`}>
                    <span className="text-xs text-ink-muted">{ch.label} · </span>
                    {ch.title}
                  </p>
                  {ready && chapterProgress.started && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="w-28">
                        <ProgressBar percent={chapterProgress.percent} />
                      </div>
                      <span className="text-xs font-bold text-brand tabular">
                        {toArabicDigits(chapterProgress.percent)}٪
                      </span>
                    </div>
                  )}
                </div>

                {ready ? (
                  <button
                    type="button"
                    onClick={() => ch.courseId && onEnterChapter(ch.courseId)}
                    className="btn-primary shrink-0 px-4 py-2 text-sm"
                  >
                    {chapterProgress.completed ? 'مراجعة' : chapterProgress.started ? 'متابعة' : 'ابدأ'}
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                  </button>
                ) : (
                  <span className="chip shrink-0 bg-gold-500/15 text-gold-600 dark:text-gold-300 text-xs font-bold">
                    قريباً
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="border-t border-line bg-surface-2 px-5 py-3 text-center text-xs text-ink-muted">
          <Icon name="sparkles" className="me-1 inline w-3.5 h-3.5 text-gold-500" />
          المقدمة والفصول الثلاثة متاحة الآن بمحتواها التدريبي التفاعلي.
        </div>
      </div>
    </div>
  );
}
