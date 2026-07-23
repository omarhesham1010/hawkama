import { Icon } from './Icon';
import type { IconKey } from '../../types/course';

type Tone = 'success' | 'error' | 'info' | 'review';

const config: Record<Tone, { wrap: string; icon: IconKey; iconWrap: string }> = {
  success: {
    wrap: 'bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-100',
    icon: 'check',
    iconWrap: 'text-green-600 dark:text-green-300',
  },
  error: {
    wrap: 'bg-rose-500/10 border-rose-400/40 text-rose-900 dark:text-rose-100',
    icon: 'alert',
    iconWrap: 'text-rose-600 dark:text-rose-300',
  },
  info: {
    wrap: 'bg-brand/8 border-brand/25 text-ink',
    icon: 'sparkles',
    iconWrap: 'text-brand',
  },
  review: {
    wrap: 'bg-gold-500/10 border-gold-500/35 text-ink',
    icon: 'alert',
    iconWrap: 'text-gold-600 dark:text-gold-400',
  },
};

export function FeedbackBox({
  tone,
  title,
  children,
  className = '',
}: {
  tone: Tone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const c = config[tone];
  return (
    <div
      role="status"
      className={`flex gap-3 rounded-xl border p-4 animate-fade-in ${c.wrap} ${className}`}
    >
      <span className={`shrink-0 ${c.iconWrap}`}>
        <Icon name={c.icon} className="w-6 h-6" />
      </span>
      <div className="space-y-1 leading-relaxed">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className="text-sm text-ink-soft">{children}</div>}
      </div>
    </div>
  );
}
