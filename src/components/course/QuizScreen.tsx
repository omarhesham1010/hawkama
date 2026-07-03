import type { QuizSection } from '../../types/course';
import { AudioNarrationButton } from '../audio/AudioNarrationButton';
import { SectionHeader } from './SectionHeader';
import { KnowledgeCheck } from '../activities/KnowledgeCheck';

export function QuizScreen({
  section,
  onComplete,
}: {
  section: QuizSection;
  onComplete: (scorePercent: number) => void;
}) {
  return (
    <div className="animate-fade-up">
      <SectionHeader
        icon={section.icon}
        tag={section.activityLabel}
        tagTone="quiz"
        title={section.title}
        intro={section.intro}
      />

      <div className="mb-6 max-w-lg">
        <AudioNarrationButton
          narrationKey={section.narrationKey}
          script={section.narration}
          label={section.navLabel}
        />
      </div>

      <KnowledgeCheck quiz={section.quiz} onComplete={onComplete} />
    </div>
  );
}
