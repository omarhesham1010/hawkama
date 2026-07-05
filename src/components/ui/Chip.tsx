type ChipTone = 'brand' | 'navy' | 'gold' | 'neutral';

const tones: Record<ChipTone, string> = {
  brand: 'bg-brand/12 text-brand',
  navy: 'bg-teal-500/12 text-teal-700 dark:text-teal-300',
  gold: 'bg-gold-500/15 text-gold-600 dark:text-gold-400',
  neutral: 'bg-surface-3 text-ink-soft',
};

export function Chip({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: React.ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return <span className={`chip ${tones[tone]} ${className}`}>{children}</span>;
}
