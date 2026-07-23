import type { Section, SectionType } from '../../types/course';
import { Icon } from '../ui/Icon';
import { ProgressBar } from './ProgressTracker';

const typeTag: Record<SectionType, { label: string; cls: string }> = {
  welcome: { label: 'تمهيد', cls: 'bg-surface-3 text-ink-muted' },
  objectives: { label: 'تمهيد', cls: 'bg-surface-3 text-ink-muted' },
  roadmap: { label: 'تمهيد', cls: 'bg-surface-3 text-ink-muted' },
  lesson: { label: 'درس', cls: 'bg-green-500/12 text-green-700 dark:text-green-300' },
  activity: { label: 'نشاط', cls: 'bg-brand/12 text-brand' },
  quiz: { label: 'اختبار', cls: 'bg-gold-500/15 text-gold-600 dark:text-gold-400' },
  summary: { label: 'ملخص', cls: 'bg-surface-3 text-ink-muted' },
  completion: { label: 'إنهاء', cls: 'bg-green-500/12 text-green-700 dark:text-green-200' },
};

export function LessonSidebar({
  sections,
  currentIndex,
  percent,
  isComplete,
  onNavigate,
  open,
  onClose,
}: {
  sections: Section[];
  currentIndex: number;
  percent: number;
  isComplete: (id: string) => boolean;
  onNavigate: (index: number) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-green-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[300px] flex-col border-s border-line bg-surface transition-transform duration-300 lg:static lg:z-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <div className="w-full">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold text-ink">محطات الوحدة</p>
              <span className="text-xs font-semibold text-brand tabular">{percent}٪ مكتمل</span>
            </div>
            <ProgressBar percent={percent} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ms-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:text-brand lg:hidden"
            aria-label="إغلاق"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="scroll-slim flex-1 space-y-1 overflow-y-auto p-3">
          {sections.map((section, index) => {
            const active = index === currentIndex;
            const done = isComplete(section.id);
            const tag = typeTag[section.type];
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => {
                  onNavigate(index);
                  onClose();
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors ${
                  active
                    ? 'bg-brand/12 ring-1 ring-brand/30'
                    : 'hover:bg-surface-2'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    done
                      ? 'bg-green-500/15 text-green-600 dark:text-green-300'
                      : active
                        ? 'bg-brand text-white'
                        : 'bg-surface-3 text-ink-muted'
                  }`}
                >
                  {done ? <Icon name="check" className="w-5 h-5" /> : <Icon name={section.icon} className="w-4 h-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm ${active ? 'font-bold text-ink' : 'font-medium text-ink-soft'}`}>
                    {section.navLabel}
                  </span>
                </span>
                <span className={`chip shrink-0 px-2 py-0.5 text-[10px] ${tag.cls}`}>{tag.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
