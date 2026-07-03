import { useCallback } from 'react';
import type { ActivitySection } from '../../types/course';
import { AudioNarrationButton } from '../audio/AudioNarrationButton';
import { SectionHeader } from './SectionHeader';
import { ActivityShell, type Accent } from '../activities/ActivityShell';
import { ClassificationActivity } from '../activities/ClassificationActivity';
import { ThreeLinesDefenseGame } from '../activities/ThreeLinesDefenseGame';
import { GovernanceFrameworkBuilder } from '../activities/GovernanceFrameworkBuilder';
import { ScenarioDecisionActivity } from '../activities/ScenarioDecisionActivity';
import { FlipCardActivity } from '../activities/FlipCardActivity';
import { TrueFalseGame } from '../activities/TrueFalseGame';

const hints: Record<string, string> = {
  classification: 'اضغط التصنيف المناسب لكل إجراء، وستظهر لك التغذية الراجعة فوراً.',
  threeLines: 'اختر دوراً ثم ضعه في خطه الصحيح، ثم اضغط «تحقّق».',
  frameworkBuilder: 'اضغط المكوّنات بالترتيب الصحيح لبناء سلسلة الحوكمة.',
  scenarioDecision: 'حدّد المخالفة، رتّب مسار الإجراء الصحيح، ثم تأمّل نقاط النقاش.',
  flipCards: 'اضغط كل بطاقة لقلبها وكشف تعريفها.',
  trueFalse: 'اقرأ كل عبارة واضغط «صواب» أو «خطأ» بسرعة، وحافظ على سلسلتك 🔥.',
};

// A cheerful, distinct accent per activity (primary identity stays green/gold).
const accents: Record<string, Accent> = {
  'three-lines-game': 'sky',
  'framework-builder': 'violet',
  'governance-compliance-activity': 'amber',
  'ethics-flip-cards': 'rose',
  'conflict-interest-simulation': 'emerald',
  'true-false-game': 'cyan',
};

export function ActivityScreen({
  section,
  done,
  onActivityDone,
}: {
  section: ActivitySection;
  done: boolean;
  onActivityDone: (id: string) => void;
}) {
  const handleDone = useCallback(() => onActivityDone(section.id), [onActivityDone, section.id]);

  return (
    <div className="animate-fade-up">
      <SectionHeader
        icon={section.icon}
        tag={section.activityLabel}
        tagTone="activity"
        title={section.title}
      />

      <div className="mb-6 max-w-lg">
        <AudioNarrationButton
          narrationKey={section.narrationKey}
          script={section.narration}
          label={section.navLabel}
        />
      </div>

      <ActivityShell
        instruction={section.intro}
        interactionHint={hints[section.data.kind]}
        accent={accents[section.id] ?? 'brand'}
        done={done}
      >
        {section.data.kind === 'classification' && (
          <ClassificationActivity data={section.data} onDone={handleDone} />
        )}
        {section.data.kind === 'threeLines' && (
          <ThreeLinesDefenseGame data={section.data} onDone={handleDone} />
        )}
        {section.data.kind === 'frameworkBuilder' && (
          <GovernanceFrameworkBuilder data={section.data} onDone={handleDone} />
        )}
        {section.data.kind === 'scenarioDecision' && (
          <ScenarioDecisionActivity data={section.data} onDone={handleDone} />
        )}
        {section.data.kind === 'flipCards' && (
          <FlipCardActivity data={section.data} onDone={handleDone} />
        )}
        {section.data.kind === 'trueFalse' && (
          <TrueFalseGame data={section.data} onDone={handleDone} />
        )}
      </ActivityShell>
    </div>
  );
}
