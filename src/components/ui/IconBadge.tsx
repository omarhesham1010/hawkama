import type { IconKey } from '../../types/course';
import { Icon } from './Icon';

type Tone = 'brand' | 'navy' | 'gold' | 'soft';
type Size = 'sm' | 'md' | 'lg';

const sizeMap: Record<Size, { box: string; icon: string }> = {
  sm: { box: 'w-9 h-9 rounded-lg', icon: 'w-5 h-5' },
  md: { box: 'w-12 h-12 rounded-xl', icon: 'w-6 h-6' },
  lg: { box: 'w-16 h-16 rounded-2xl', icon: 'w-8 h-8' },
};

const toneMap: Record<Tone, string> = {
  brand: 'bg-brand/12 text-brand',
  navy: 'bg-green-500/12 text-green-700 dark:text-green-300',
  gold: 'bg-gold-500/15 text-gold-600 dark:text-gold-400',
  soft: 'bg-surface-3 text-ink-soft',
};

/** The repeated visual motif: an icon inside a soft rounded tile. */
export function IconBadge({
  icon,
  tone = 'brand',
  size = 'md',
  className = '',
}: {
  icon: IconKey;
  tone?: Tone;
  size?: Size;
  className?: string;
}) {
  const s = sizeMap[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${s.box} ${toneMap[tone]} ${className}`}
    >
      <Icon name={icon} className={s.icon} />
    </span>
  );
}
