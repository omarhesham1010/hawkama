import { useEffect } from 'react';
import type { Slide } from '../../../types/slides';
import { Icon } from '../ui/Icon';
import { toArabicDigits } from '../../../lib/utils';

const kindLabel: Record<string, { label: string; cls: string }> = {
  welcome: { label: 'مقدمة', cls: 'bg-surface-3 text-ink-muted' },
  content: { label: 'شريحة', cls: 'bg-tealLegacy-500/12 text-tealLegacy-700 dark:text-tealLegacy-300' },
  activity: { label: 'نشاط', cls: 'bg-brand/12 text-brand' },
  quiz: { label: 'اختبار', cls: 'bg-goldLegacy-500/15 text-goldLegacy-600 dark:text-goldLegacy-300' },
  reflection: { label: 'تأمّل', cls: 'bg-goldLegacy-500/12 text-goldLegacy-600 dark:text-goldLegacy-300' },
  completion: { label: 'إنهاء', cls: 'bg-greenLegacy-500/12 text-greenLegacy-700 dark:text-greenLegacy-300' },
};

export function SlideMenu({
  slides,
  current,
  visited,
  open,
  onClose,
  onJump,
}: {
  slides: Slide[];
  current: number;
  visited: (id: string) => boolean;
  open: boolean;
  onClose: () => void;
  onJump: (index: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-greenLegacy-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-[320px] max-w-[85vw] flex-col border-e border-line bg-surface shadow-card-lg animate-slide-in">
        <div className="flex items-center justify-between border-b border-line p-4">
          <p className="flex items-center gap-2 font-bold text-ink">
            <Icon name="book" className="w-5 h-5 text-brand" />
            محتوى الدورة
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:text-brand"
            aria-label="إغلاق"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="scroll-slim flex-1 space-y-1 overflow-y-auto p-3">
          {slides.map((s, i) => {
            const active = i === current;
            const done = visited(s.id) && !active;
            const k = kindLabel[s.kind] ?? kindLabel.content;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onJump(i);
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors ${
                  active ? 'bg-brand/12 ring-1 ring-brand/30' : 'hover:bg-surface-2'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular ${
                    done
                      ? 'bg-greenLegacy-500/15 text-greenLegacy-600 dark:text-greenLegacy-300'
                      : active
                        ? 'bg-brand text-white'
                        : 'bg-surface-3 text-ink-muted'
                  }`}
                >
                  {done ? <Icon name="check" className="w-4 h-4" /> : toArabicDigits(s.index)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${active ? 'font-bold text-ink' : 'font-medium text-ink-soft'}`}>
                    {s.title}
                  </span>
                </span>
                <span className={`chip shrink-0 px-2 py-0.5 text-[10px] ${k.cls}`}>{k.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
