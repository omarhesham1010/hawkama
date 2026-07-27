import { Icon } from './Icon';
import type { IconKey } from '../../../types/course';

/** Small "completed" achievement badge used for activities and the sidebar. */
export function Badge({
  label,
  icon = 'check',
  earned = true,
}: {
  label: string;
  icon?: IconKey;
  earned?: boolean;
}) {
  return (
    <span
      className={`chip text-sm font-semibold ${
        earned
          ? 'bg-tealLegacy-500/12 text-tealLegacy-700 dark:text-tealLegacy-200'
          : 'bg-surface-3 text-ink-muted'
      }`}
    >
      <Icon name={icon} className="w-4 h-4" />
      {label}
    </span>
  );
}

/** Large celebratory medallion for the completion screen (pure SVG/CSS). */
export function CompletionMedallion({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} role="img" aria-label="شارة إتمام الوحدة">
      <defs>
        <linearGradient id="med-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--brand-soft))" />
          <stop offset="1" stopColor="rgb(var(--brand))" />
        </linearGradient>
      </defs>
      {[...Array(24)].map((_, i) => (
        <rect
          key={i}
          x="79"
          y="6"
          width="2"
          height="10"
          rx="1"
          fill="rgb(var(--brand) / 0.35)"
          transform={`rotate(${i * 15} 80 80)`}
        />
      ))}
      <circle cx="80" cy="80" r="58" fill="url(#med-g)" />
      <circle cx="80" cy="80" r="58" fill="none" stroke="#d8b45a" strokeWidth="2.5" />
      <circle cx="80" cy="80" r="47" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
      <path
        d="M62 82l12 12 24-27"
        fill="none"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
