import type { SummarySection } from '../../types/course';
import { IconBadge } from '../ui/IconBadge';
import { AudioNarrationButton } from '../audio/AudioNarrationButton';
import { SectionHeader } from './SectionHeader';

export function SummaryScreen({ section }: { section: SummarySection }) {
  return (
    <div className="animate-fade-up">
      <SectionHeader icon={section.icon} tag="ملخص الوحدة" tagTone="neutral" title={section.title} intro={section.intro} />

      <div className="mb-6 max-w-lg">
        <AudioNarrationButton
          narrationKey={section.narrationKey}
          script={section.narration}
          label={section.navLabel}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {section.takeaways.map((t, i) => (
          <div
            key={i}
            className="lift flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card animate-fade-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <IconBadge icon={t.icon} tone="brand" size="md" />
            <div>
              <p className="font-bold text-ink">{t.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{t.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
