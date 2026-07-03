import type { RoadmapSection } from '../../types/course';
import { Icon } from '../ui/Icon';
import { IconBadge } from '../ui/IconBadge';
import { AudioNarrationButton } from '../audio/AudioNarrationButton';
import { SectionHeader } from './SectionHeader';
import { toArabicDigits } from '../../lib/utils';

const kindCls: Record<string, string> = {
  درس: 'bg-teal-500/12 text-teal-700 dark:text-teal-300',
  نشاط: 'bg-brand/12 text-brand',
  اختبار: 'bg-gold-500/15 text-gold-600 dark:text-gold-400',
  ملخص: 'bg-surface-3 text-ink-muted',
};

export function RoadmapScreen({ section }: { section: RoadmapSection }) {
  return (
    <div className="animate-fade-up">
      <SectionHeader icon={section.icon} tag="خريطة الوحدة" tagTone="neutral" title={section.title} intro={section.intro} />

      <div className="mb-6 max-w-lg">
        <AudioNarrationButton
          narrationKey={section.narrationKey}
          script={section.narration}
          label={section.navLabel}
        />
      </div>

      <ol className="relative space-y-3 ps-4">
        {/* vertical rail */}
        <span className="absolute bottom-4 top-4 right-[11px] w-px bg-line" aria-hidden="true" />
        {section.stops.map((stop, i) => (
          <li key={i} className="relative flex items-center gap-4">
            <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white tabular">
              {toArabicDigits(i + 1)}
            </span>
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-card">
              <IconBadge icon={stop.icon} tone="soft" size="sm" />
              <p className="flex-1 font-semibold text-ink">{stop.label}</p>
              <span className={`chip text-xs ${kindCls[stop.kind] ?? 'bg-surface-3 text-ink-muted'}`}>
                {stop.kind === 'نشاط' && <Icon name="target" className="w-3.5 h-3.5" />}
                {stop.kind}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
