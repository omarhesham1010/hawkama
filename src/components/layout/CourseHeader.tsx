import type { Theme } from '../../hooks/useTheme';
import { Icon } from '../ui/Icon';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ProgressRing } from './ProgressTracker';

export function CourseHeader({
  title,
  chapter,
  percent,
  theme,
  onToggleTheme,
  onToggleSidebar,
  onExit,
}: {
  title: string;
  chapter: string;
  percent: number;
  theme: Theme;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onExit?: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4">
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-2.5 text-sm font-semibold text-ink-soft hover:text-brand"
            title="العودة إلى المنصة"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
            <span className="hidden sm:inline">المنصة</span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-soft hover:text-brand lg:hidden"
          aria-label="قائمة المحطات"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-700 text-white shadow-card">
            <Icon name="shield" className="w-6 h-6" />
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-bold text-ink sm:text-sm">{title}</p>
            <p className="text-[11px] text-ink-muted">{chapter}</p>
          </div>
        </div>

        <div className="ms-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <ProgressRing percent={percent} />
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
