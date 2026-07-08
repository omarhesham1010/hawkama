import type { PptCard } from '../types/slides';
import { allNarratedSlides as slides } from './slides';

export type AudioCategory =
  | 'slide'
  | 'activity-question'
  | 'activity-feedback'
  | 'scenario-question'
  | 'scenario-discussion'
  | 'scenario-completion';

export interface AudioScriptItem {
  key: string;
  title: string;
  text: string;
  category: AudioCategory;
  relatedSlide: string;
  estimatedDuration: number;
}

const ARABIC_ORDINALS = ['الأول', 'الثاني', 'الثالث', 'الرابع'];
const ARABIC_CARDINALS = ['واحد', 'اثنين', 'ثلاثة', 'أربعة'];

export function governanceQuestionText(card: PptCard, index: number, total: number) {
  const ordinal = ARABIC_ORDINALS[index] ?? String(index + 1);
  const count = ARABIC_CARDINALS[total - 1] ?? String(total);
  return `السؤال ${ordinal} من ${count}. ${card.text}. هل هذا قرار حوكمة أم إجراء امتثال؟ فكر، ثم اختر إجابتك.`;
}

export function governanceFeedbackText(card: PptCard, answer: string) {
  const correct = answer === card.answer;
  const response = correct
    ? `ممتاز، اختيارك صحيح. ${card.rationale ?? ''}`
    : `خلنا نراجعها معًا. التصنيف الصحيح هو ${card.answer}. ${card.rationale ?? ''}`;
  return response;
}

export function activityCardDiscussion(card: PptCard) {
  const discussion = card.rationale ?? 'اربط النقطة بموقف عملي وحدد المسؤولية ودليل التحقق.';
  return `خلنا نناقشها معًا. ${discussion}`;
}

export const conflictScenarioQuestions = [
  'بعد ما عرفت السيناريو، فكر بهدوء: ما نوع المخالفة هنا؟ وهل التضارب فعلي أم محتمل؟',
  'الآن فكر كمسؤول امتثال: ما الإجراء المؤسسي الصحيح لحماية القرار؟',
  'السؤال الأخير: هل يكفي الإفصاح وحده؟ وما الضوابط التي تمنع أن يصبح الامتثال شكليًا؟',
] as const;

export const conflictScenarioDiscussions = [
  'الإجابة هنا أن الحالة تمثل تضارب مصالح فعليًا وقائمًا، وليست مجرد احتمال مستقبلي. الموظف يملك مصلحة تجارية بالفعل مع شركة متنافسة، وفي الوقت نفسه يشارك في لجنة تؤثر في قرار الشراء. هذا الوضع يخل بالحياد، وقد يفتح مجالًا لاستغلال النفوذ، حتى لو لم يثبت أنه وجّه القرار لمصلحته.',
  'المعالجة المؤسسية الصحيحة تبدأ بالإفصاح الرسمي عن المصلحة، ثم تنحي الموظف بالكامل عن مناقشة القرار والتصويت عليه. بعد ذلك توثق الحالة والإجراءات المتخذة. وتتولى لجنة الامتثال والأخلاقيات الإشراف والمراجعة، حتى يكون القرار مستقلًا وقابلًا للتحقق والمساءلة.',
  'الإفصاح وحده لا يكفي، لأنه يكشف التعارض، لكنه لا يزيل أثره عن القرار. الحماية الفعلية تحتاج إلى التنحي، وفصل الصلاحيات، وتوثيق القرار، ومراجعة مستقلة، ومتابعة دورية للتأكد من تطبيق الضوابط. بهذه الآليات يصبح الامتثال ممارسة مؤسسية حقيقية، وليس إجراءً شكليًا.',
] as const;

export const conflictScenarioCompletion =
  'ممتاز. كذا حللنا الحالة من تحديد المخالفة إلى الإجراء الصحيح ثم الضوابط المؤسسية. الأهم أن الإفصاح بداية المعالجة وليس نهايتها.';

function item(
  key: string,
  title: string,
  text: string,
  category: AudioCategory,
  relatedSlide: string,
): AudioScriptItem {
  return {
    key,
    title,
    text,
    category,
    relatedSlide,
    estimatedDuration: Math.max(2, Math.ceil(text.length / 11)),
  };
}

const mainSlideItems = slides.map((slide) =>
  item(slide.audioKey, slide.title, slide.narration, 'slide', slide.id),
);

const genericActivityDetailItems = slides
  .filter(
    (slide) =>
      slide.kind === 'activity' &&
      !['pptActivitySort', 'pptScenario'].includes(slide.layout ?? ''),
  )
  .flatMap((slide) =>
    (slide.ppt?.cards ?? []).map((card, index) =>
      item(
        `${slide.audioKey}-detail-${index + 1}`,
        `${slide.title} - مناقشة ${index + 1}`,
        activityCardDiscussion(card),
        'activity-feedback',
        slide.id,
      ),
    ),
  );

const governanceSlide = slides.find((slide) => slide.id === 'ppt-activity-governance-or-compliance');
const governanceCards = governanceSlide?.ppt?.cards ?? [];
const governanceQuestionItems = governanceCards.slice(1).map((card, offset) => {
  const index = offset + 1;
  const number = index + 1;
  return item(
    `${governanceSlide?.audioKey}-question-${number}`,
    `نشاط الحوكمة والامتثال - السؤال ${number}`,
    governanceQuestionText(card, index, governanceCards.length),
    'activity-question',
    governanceSlide?.id ?? 'ppt-activity-governance-or-compliance',
  );
});
const governanceFeedbackItems = governanceCards.flatMap((card, index) => {
  const number = index + 1;
  const correct = item(
    `${governanceSlide?.audioKey}-feedback-${number}-correct`,
    `نشاط الحوكمة والامتثال - إجابة ${number} صحيحة`,
    governanceFeedbackText(card, card.answer ?? ''),
    'activity-feedback',
    governanceSlide?.id ?? 'ppt-activity-governance-or-compliance',
  );
  const incorrectAnswer = card.answer === 'حوكمة' ? 'امتثال' : 'حوكمة';
  const incorrect = item(
    `${governanceSlide?.audioKey}-feedback-${number}-incorrect`,
    `نشاط الحوكمة والامتثال - إجابة ${number} غير صحيحة`,
    governanceFeedbackText(card, incorrectAnswer),
    'activity-feedback',
    governanceSlide?.id ?? 'ppt-activity-governance-or-compliance',
  );
  return [correct, incorrect];
});

const scenarioSlide = slides.find((slide) => slide.id === 'ppt-conflict-scenario');
const scenarioKey = scenarioSlide?.audioKey ?? 'ppt-conflict-scenario';
const scenarioItems = [
  ...conflictScenarioQuestions.slice(1).map((text, offset) => {
    const index = offset + 1;
    return (
    item(
      `${scenarioKey}-question-${index + 1}`,
      `سيناريو تضارب المصالح - السؤال ${index + 1}`,
      text,
      'scenario-question',
      scenarioSlide?.id ?? scenarioKey,
    ));
  }),
  ...conflictScenarioDiscussions.map((text, index) =>
    item(
      `${scenarioKey}-discussion-${index + 1}`,
      `سيناريو تضارب المصالح - المناقشة ${index + 1}`,
      text,
      'scenario-discussion',
      scenarioSlide?.id ?? scenarioKey,
    ),
  ),
  item(
    `${scenarioKey}-complete`,
    'سيناريو تضارب المصالح - الختام',
    conflictScenarioCompletion,
    'scenario-completion',
    scenarioSlide?.id ?? scenarioKey,
  ),
];

export const audioScripts: AudioScriptItem[] = [
  ...mainSlideItems,
  ...genericActivityDetailItems,
  ...governanceQuestionItems,
  ...governanceFeedbackItems,
  ...scenarioItems,
];

export function audioScriptByKey(key: string) {
  return audioScripts.find((entry) => entry.key === key);
}
