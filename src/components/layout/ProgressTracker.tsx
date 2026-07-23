export function ProgressBar({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-surface-3 ${className}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="نسبة إتمام الوحدة"
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${percent}%`,
          background: 'rgb(var(--brand))',
        }}
      />
    </div>
  );
}

/** Circular percentage ring used in the header. */
export function ProgressRing({ percent }: { percent: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative inline-flex h-11 w-11 items-center justify-center">
      <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgb(var(--surface-3))" strokeWidth="3.5" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="rgb(var(--brand))"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-bold text-ink tabular">{percent}٪</span>
    </div>
  );
}
