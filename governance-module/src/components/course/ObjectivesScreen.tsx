import type { ObjectivesSection } from '../../types/course';
import { IconBadge } from '../ui/IconBadge';
import { AudioNarrationButton } from '../audio/AudioNarrationButton';
import { SectionHeader } from './SectionHeader';
import { toArabicDigits } from '../../lib/utils';

export function ObjectivesScreen({ section }: { section: ObjectivesSection }) {
  return (
    <div className="animate-fade-up">
      <SectionHeader icon={section.icon} tag="أهداف التعلّم" tagTone="neutral" title={section.title} intro={section.intro} />

      <div className="mb-6 max-w-lg">
        <AudioNarrationButton
          narrationKey={section.narrationKey}
          script={section.narration}
          label={section.navLabel}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {section.objectives.map((obj, i) => (
          <div
            key={i}
            className="lift flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card animate-fade-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <IconBadge icon={obj.icon} tone="brand" size="md" />
            <div>
              <span className="text-xs font-bold text-brand tabular">الهدف {toArabicDigits(i + 1)}</span>
              <p className="mt-0.5 font-semibold leading-relaxed text-ink">{obj.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
