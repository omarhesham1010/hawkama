import type { PptCard } from '../types/slides';
import type { QuizQuestion } from '../types/course';
import { allNarratedSlides as slides } from './slides';
import { CHECK_INTROS } from './narrationPhrases';
import { course1AudioScriptOverrides, course1AudioScriptText } from './course1AudioScriptOverrides';

export type AudioCategory =
  | 'slide'
  | 'activity-question'
  | 'activity-feedback'
  | 'scenario-question'
  | 'scenario-discussion'
  | 'scenario-completion'
  | 'quiz-feedback';

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
    : `لنراجعها معًا. التصنيف الصحيح هو ${card.answer}. ${card.rationale ?? ''}`;
  return response;
}

export function activityCardDiscussion(card: PptCard) {
  const discussion = card.rationale ?? 'اربط النقطة بموقف عملي وحدد المسؤولية ودليل التحقق.';
  return `لنناقشها معًا. ${discussion}`;
}

export function quizFeedbackText(question: QuizQuestion, correct: boolean) {
  if (correct) {
    return `ممتاز، إجابتك صحيحة. ${question.explanation}`;
  }

  return `لنراجعها معًا. إجابتك غير صحيحة. الإجابة الصحيحة هي: ${question.options[question.correctIndex]}. ${question.explanation}`;
}

export const conflictScenarioQuestions = [
  'بعد أن عرفت السيناريو، فكر بهدوء: ما نوع المخالفة هنا؟ وهل التضارب فعلي أم محتمل؟',
  'الآن فكر كمسؤول امتثال: ما الإجراء المؤسسي الصحيح لحماية القرار؟',
  'السؤال الأخير: هل يكفي الإفصاح وحده؟ وما الضوابط التي تمنع أن يصبح الامتثال شكليًا؟',
] as const;

export const conflictScenarioDiscussions = [
  'نبدأ بتحديد المخالفة. هل هو تضارب فعلي، حالي، أم محتمل، مستقبلي؟ الإجابة هنا أن الحالة تمثل تضارب مصالح فعليًا وقائمًا، وليست مجرد احتمال مستقبلي. وتشمل المخالفة ثلاثة جوانب: تضارب مصالح. إخلال بالحياد. استغلال نفوذ. الموظف يملك مصلحة تجارية بالفعل مع شركة متنافسة، وفي الوقت نفسه يشارك في لجنة تؤثر في قرار الشراء. هذا الوضع يخل بالحياد، حتى لو لم يثبت أنه وجّه القرار لمصلحته.',
  'الإجراء الصحيح هو: الإفصاح، ثم التنحي عن القرار، ثم توثيق الحالة، مع إشراف لجنة الامتثال والأخلاقيات. تبدأ المعالجة المؤسسية بالإفصاح الرسمي عن المصلحة، ثم تنحي الموظف بالكامل عن مناقشة القرار والتصويت عليه. بعد ذلك توثق الحالة والإجراءات المتخذة. وتتولى لجنة الامتثال والأخلاقيات الإشراف والمراجعة، حتى يكون القرار مستقلًا وقابلًا للتحقق والمساءلة.',
  'نعود إلى نقاط للنقاش: هل يكفي الإفصاح وحده؟ ما آليات الحماية المؤسسية الواجب تفعيلها؟ كيف نضمن أن الامتثال ليس شكليًا؟ الإفصاح وحده لا يكفي، لأنه يكشف التعارض، لكنه لا يزيل أثره عن القرار. الحماية الفعلية تحتاج إلى التنحي، وفصل الصلاحيات، وتوثيق القرار، ومراجعة مستقلة، ومتابعة دورية للتأكد من تطبيق الضوابط. بهذه الآليات يصبح الامتثال ممارسة مؤسسية حقيقية، وليس إجراءً شكليًا.',
] as const;

export const conflictScenarioCompletion =
  'ممتاز. بذلك حللنا الحالة من تحديد المخالفة إلى الإجراء الصحيح ثم الضوابط المؤسسية. والأهم أن الإفصاح بداية المعالجة وليس نهايتها.';

function item(
  key: string,
  title: string,
  text: string,
  category: AudioCategory,
  relatedSlide: string,
): AudioScriptItem {
  const scriptText = course1AudioScriptText(key, text);
  return {
    key,
    title,
    text: scriptText,
    category,
    relatedSlide,
    estimatedDuration: Math.max(2, Math.ceil(scriptText.length / 11)),
  };
}

const mainSlideItems = slides.map((slide) =>
  item(slide.audioKey, slide.title, slide.narration, 'slide', slide.id),
);

function findSlideForAudio(id: string) {
  const matchingSlides = slides.filter((slide) => slide.id === id);
  return matchingSlides.find((slide) => slide.audioKey.endsWith('-course1')) ?? matchingSlides[0];
}

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

const governanceSlide = findSlideForAudio('ppt-activity-governance-or-compliance');
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

const scenarioSlide = findSlideForAudio('ppt-conflict-scenario');
const scenarioKey = scenarioSlide?.audioKey ?? 'ppt-conflict-scenario';
const scenarioItems = [
  ...conflictScenarioQuestions.map((text, index) =>
    item(
      `${scenarioKey}-question-${index + 1}`,
      `سيناريو تضارب المصالح - السؤال ${index + 1}`,
      text,
      'scenario-question',
      scenarioSlide?.id ?? scenarioKey,
    ),
  ),
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

const quizFeedbackItems = slides
  .filter((slide) => slide.kind === 'quiz' && slide.quiz)
  .flatMap((slide) =>
    (slide.quiz?.questions ?? []).flatMap((question, index) => [
      item(
        `${slide.audioKey}-feedback-${question.id}-correct`,
        `${slide.title} - السؤال ${index + 1} - إجابة صحيحة`,
        quizFeedbackText(question, true),
        'quiz-feedback',
        slide.id,
      ),
      item(
        `${slide.audioKey}-feedback-${question.id}-incorrect`,
        `${slide.title} - السؤال ${index + 1} - إجابة غير صحيحة`,
        quizFeedbackText(question, false),
        'quiz-feedback',
        slide.id,
      ),
    ]),
  );

const checkItems = slides.flatMap((slide) => {
  const check = slide.ppt?.checks?.[0];
  if (!check) return [];
  const intro = CHECK_INTROS[slide.index % CHECK_INTROS.length];
  const answerLine = check.rationale ? `${check.answer}. ${check.rationale}` : check.answer ?? '';
  return [
    item(
      `${slide.audioKey}-check-ask`,
      `${slide.title} - سؤال تفاعلي`,
      `${intro} ${check.title}`,
      'activity-question',
      slide.id,
    ),
    item(
      `${slide.audioKey}-check-answer`,
      `${slide.title} - إجابة السؤال التفاعلي`,
      answerLine,
      'activity-feedback',
      slide.id,
    ),
  ];
});

// Nasser's spoken reaction to each interactive checkpoint (PptContent.
// actActivities): correct/incorrect feedback for a decision, the rationale
// once an item is classified, or a flip card's own front+back. Text is
// derived straight from the same activity data the components render, so
// the recording can never drift from what's on screen. See
// src/lib/playVoiceClip.ts for how these play independently of the slide's
// own (possibly mid-pause) narration track.
const checkpointVoiceItems = slides.flatMap((slide) => {
  const acts = slide.ppt?.actActivities ?? [];
  return acts.flatMap((checkpoint, actIndex) => {
    if (!checkpoint) return [];
    const a = checkpoint.activity;
    const label = `${slide.title} - نشاط تفاعلي ${actIndex + 1}`;

    if (a.kind === 'scenarioDecision') {
      const correctOpt = a.identify.options.find((o) => o.correct);
      const correctPathSummary = a.correctPath.map((s) => s.label).join('، ثم ');
      const out: AudioScriptItem[] = [];
      if (a.identify.correctVoiceKey) {
        out.push(item(
          a.identify.correctVoiceKey,
          `${label} - إجابة صحيحة`,
          `إجابة صحيحة، ${correctOpt?.label}. ${a.identify.suggestedNote}`,
          'activity-feedback',
          slide.id,
        ));
      }
      if (a.identify.incorrectVoiceKey) {
        out.push(item(
          a.identify.incorrectVoiceKey,
          `${label} - إجابة غير صحيحة`,
          `الإجابة الصحيحة هي، ${correctOpt?.label}. ${a.identify.suggestedNote}`,
          'activity-feedback',
          slide.id,
        ));
      }
      if (a.pathCorrectVoiceKey) {
        out.push(item(
          a.pathCorrectVoiceKey,
          `${label} - مسار صحيح`,
          `مسار صحيح تمامًا! ${correctPathSummary}`,
          'activity-feedback',
          slide.id,
        ));
      }
      if (a.pathIncorrectVoiceKey) {
        out.push(item(
          a.pathIncorrectVoiceKey,
          `${label} - مسار غير صحيح`,
          `المسار غير مرتّب بشكل صحيح. الترتيب الصحيح، ${correctPathSummary}`,
          'activity-feedback',
          slide.id,
        ));
      }
      return out;
    }

    if (a.kind === 'classification') {
      return a.items
        .filter((it) => it.voiceKey)
        .map((it) => item(
          it.voiceKey!,
          `${label} - ${it.id}`,
          `التصنيف المقترح، ${a.categories.find((c) => c.id === it.answer)?.label ?? ''}. ${it.rationale}`,
          'activity-feedback',
          slide.id,
        ));
    }

    if (a.kind === 'flipCards') {
      return a.cards
        .filter((c) => c.voiceKey)
        .map((c) => item(
          c.voiceKey!,
          `${label} - ${c.id}`,
          `${c.front}. ${c.back}`,
          'activity-feedback',
          slide.id,
        ));
    }

    return [];
  });
});

function uniqueAudioScripts(items: AudioScriptItem[]) {
  const byKey = new Map<string, AudioScriptItem>();
  for (const entry of items) {
    const existing = byKey.get(entry.key);
    if (!existing) {
      byKey.set(entry.key, entry);
      continue;
    }
    if (existing.text !== entry.text || existing.category !== entry.category) {
      throw new Error(`Duplicate audio key with different script text: ${entry.key}`);
    }
  }
  return [...byKey.values()];
}

const generatedAudioScripts = [
  ...mainSlideItems,
  ...genericActivityDetailItems,
  ...governanceQuestionItems,
  ...governanceFeedbackItems,
  ...scenarioItems,
  ...quizFeedbackItems,
  ...checkItems,
  ...checkpointVoiceItems,
];

const generatedKeys = new Set(generatedAudioScripts.map((entry) => entry.key));

const course1OverrideOnlyItems = Object.entries(course1AudioScriptOverrides)
  .filter(([key]) => !generatedKeys.has(key))
  .map(([key, text]) => item(key, key, text, 'activity-feedback', key));

export const audioScripts: AudioScriptItem[] = uniqueAudioScripts([
  ...generatedAudioScripts,
  ...course1OverrideOnlyItems,
]);

export function audioScriptByKey(key: string) {
  return audioScripts.find((entry) => entry.key === key);
}

export function scriptTextForAudioKey(key: string, fallback: string) {
  return audioScriptByKey(key)?.text ?? fallback;
}
