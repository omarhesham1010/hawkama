import type { IconKey } from '../../types/course';
import { Icon } from '../ui/Icon';
import { IconBadge } from '../ui/IconBadge';

type TagTone = 'lesson' | 'activity' | 'quiz' | 'neutral';

const tagCls: Record<TagTone, string> = {
  lesson: 'bg-green-500/12 text-green-700 dark:text-green-300',
  activity: 'bg-brand/12 text-brand',
  quiz: 'bg-gold-500/15 text-gold-600 dark:text-gold-400',
  neutral: 'bg-surface-3 text-ink-muted',
};

export function SectionHeader({
  icon,
  tag,
  tagTone = 'neutral',
  title,
  intro,
}: {
  icon: IconKey;
  tag: string;
  tagTone?: TagTone;
  title: string;
  intro?: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <IconBadge icon={icon} tone={tagTone === 'quiz' ? 'gold' : 'brand'} size="md" className="hidden sm:inline-flex animate-float" />
      <div className="min-w-0">
        <span className={`chip mb-2 text-xs font-bold ${tagCls[tagTone]}`}>
          <Icon name={tagTone === 'activity' ? 'target' : tagTone === 'quiz' ? 'quiz' : 'book'} className="w-4 h-4" />
          {tag}
        </span>
        <h1 className="text-xl font-bold leading-tight text-brand-strong sm:text-2xl">{title}</h1>
        {intro && <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{intro}</p>}
      </div>
    </div>
  );
}
