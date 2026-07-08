import { toArabicDigits } from '../../lib/utils';

function CtrlButton({
  onClick,
  label,
  children,
  disabled,
  primary,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`player-control-icon inline-flex items-center justify-center rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
        primary
          ? 'h-12 w-12 text-white shadow-card'
          : 'h-10 w-10 bg-surface-2 text-ink-soft hover:text-brand hover:bg-surface-3'
      }`}
      style={primary ? { background: 'linear-gradient(135deg, rgb(var(--brand-soft)), rgb(var(--brand)))' } : undefined}
    >
      {children}
    </button>
  );
}

export function PlayerControls({
  index,
  total,
  onPrev,
  onNext,
  onPlayPause,
  onReplay,
  onToggleMute,
  muted,
  isPlaying,
  isLoading,
  progress,
  sourceLabel,
}: {
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onReplay: () => void;
  onToggleMute: () => void;
  muted: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number; // 0..1 within-slide timeline
  sourceLabel: string | null;
}) {
  return (
    <div className="shrink-0 border-t border-line bg-surface/90 backdrop-blur-md">
      <div className="player-controls-inner mx-auto flex max-w-5xl items-center gap-1.5 px-2 py-2.5 sm:gap-3 sm:px-5 sm:py-3">
        {/* previous (points right in RTL = back) */}
        <CtrlButton onClick={onPrev} label="الشريحة السابقة" disabled={index === 0}>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </CtrlButton>

        {/* play / pause */}
        <CtrlButton onClick={onPlayPause} label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'} primary>
          {isLoading ? (
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
          ) : isPlaying ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </CtrlButton>

        {/* replay */}
        <CtrlButton onClick={onReplay} label="إعادة الشريحة">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 3v4h4" />
          </svg>
        </CtrlButton>

        {/* mute */}
        <CtrlButton onClick={onToggleMute} label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}>
          {muted ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9z" />
              <path d="M17 9l4 6M21 9l-4 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 9v6h4l5 4V5L8 9z" />
              <path d="M16 9a4 4 0 010 6" />
            </svg>
          )}
        </CtrlButton>

        {/* timeline progress */}
        <div className="mx-0 flex min-w-0 flex-1 items-center gap-2 sm:mx-1 sm:gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width] duration-200 ease-linear"
              style={{
                width: `${Math.round(progress * 100)}%`,
                background: 'linear-gradient(90deg, rgb(var(--brand-soft)), rgb(var(--brand)))',
              }}
            />
          </div>
          <span className="hidden shrink-0 text-xs font-semibold text-ink-muted tabular min-[420px]:inline">
            {toArabicDigits(index + 1)} / {toArabicDigits(total)}
          </span>
        </div>

        {sourceLabel && (
          <span className="hidden shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand sm:inline">
            {sourceLabel}
          </span>
        )}

        {/* next (primary forward) */}
        <button
          type="button"
          onClick={onNext}
          className="player-next-button btn-primary shrink-0 px-3 py-2.5 text-sm sm:px-4"
        >
          <span className="hidden sm:inline">{index === total - 1 ? 'إنهاء الوحدة' : 'التالي'}</span>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {index === total - 1 ? <path d="M5 12h14M13 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
          </svg>
        </button>
      </div>
    </div>
  );
}
