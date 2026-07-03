import type { LessonSection } from '../../types/course';
import { AudioNarrationButton } from '../audio/AudioNarrationButton';
import { SectionHeader } from './SectionHeader';
import { LessonBlockView } from './LessonBlocks';

export function LessonScreen({ section }: { section: LessonSection }) {
  return (
    <div className="animate-fade-up">
      <SectionHeader icon={section.icon} tag="درس" tagTone="lesson" title={section.title} intro={section.intro} />

      <div className="mb-6 max-w-lg">
        <AudioNarrationButton
          narrationKey={section.narrationKey}
          script={section.narration}
          label={section.navLabel}
        />
      </div>

      <div className="space-y-5">
        {section.blocks.map((block, i) => (
          <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <LessonBlockView block={block} />
          </div>
        ))}
      </div>
    </div>
  );
}
