import type { ActivityCheckpoint, PptCard, PptLayout, Slide, SlideKind } from '../types/slides';
import type { ActivityData, IconKey, QuizData } from '../types/course';

export const emptyTimeline: Slide['timeline'] = [];

const TITLE_BRIDGES = [
  'نركز في هذه الشريحة على',
  'محورنا هنا هو',
  'في هذه المحطة نتحدث عن',
  'موضوعنا الآن هو',
  'تدور هذه الشريحة حول',
  'ننتقل الآن إلى',
];

let slideOpeningSequence = 0;

export function humanizeNumbers(text: string): string {
  return text.replace(/\b(\d{1,3})000\b/g, (_match, n: string) => `${n} ألف`);
}

// Narration sometimes spells an acronym out letter-by-letter for correct TTS
// pronunciation (e.g. "R-A-C-I" instead of "RACI"). Collapse those hyphenated
// single-letter runs back into one word before tokenizing, so a hyphenated
// acronym in the narration still counts as covering the plain acronym token
// in the title.
function collapseHyphenatedLetterRuns(text: string): string {
  return text.replace(/\b(?:\p{L}-){1,}\p{L}\b/gu, (match) => match.replace(/-/g, ''));
}

export function narrationCoversTitle(title: string, narration: string) {
  const words = title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1);
  const spoken = new Set(
    collapseHyphenatedLetterRuns(narration)
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\p{M}/gu, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/),
  );
  return words.every((word) => spoken.has(word));
}

export function quickCheck({
  title,
  text,
  answer,
  rationale,
  tone = 'blue',
}: {
  title: string;
  text: string;
  answer: string;
  rationale: string;
  tone?: PptCard['tone'];
}): PptCard {
  return {
    index: 'تفاعل',
    title,
    text,
    answer,
    rationale,
    tone,
  };
}

export function explainCards(cards: PptCard[], intro: string) {
  const details = cards
    .map((card) => [card.title, card.text, ...(card.bullets ?? [])].filter(Boolean).join(': '))
    .filter(Boolean)
    .join('، ');
  return details ? `${intro} ${details}.` : '';
}

export function makeSlide({
  id,
  title,
  audioKey,
  narration,
  visual,
  layout,
  cards,
  laterActs,
  actLayouts,
  actActivities,
  kind = 'content',
  intro,
  prompt,
  checks,
  courseName,
  subtitle,
  unitTitle,
  activityLabel,
  activity,
  activityMode,
}: {
  id: string;
  title: string;
  audioKey: string;
  narration: string;
  visual: string;
  layout?: PptLayout;
  cards?: PptCard[];
  laterActs?: PptCard[][];
  actLayouts?: PptLayout[];
  actActivities?: (ActivityCheckpoint | undefined)[];
  kind?: SlideKind;
  intro?: string;
  prompt?: string;
  checks?: PptCard[];
  courseName?: string;
  subtitle?: string;
  unitTitle?: string;
  activityLabel?: string;
  activity?: ActivityData;
  activityMode?: 'both' | 'identify' | 'path';
}): Slide {
  const titleVariation = slideOpeningSequence % TITLE_BRIDGES.length;
  slideOpeningSequence += 1;
  const completeNarration = humanizeNumbers(
    narrationCoversTitle(title, narration) ? narration : `${TITLE_BRIDGES[titleVariation]} ${title}. ${narration}`,
  );

  return {
    id,
    index: 0,
    title,
    audioKey,
    narration: completeNarration,
    duration: Math.max(10, Math.ceil(completeNarration.length / 10.5)),
    kind,
    visual,
    layout,
    timeline: emptyTimeline,
    activityLabel,
    activity,
    activityMode,
    ppt: {
      eyebrow: layout === 'pptIntro' ? 'تحت إشراف المدرب ناصر' : undefined,
      courseName,
      subtitle,
      unitTitle,
      intro,
      prompt,
      cards,
      laterActs,
      actLayouts,
      actActivities,
      checks,
    },
  };
}

export function indexSlides(items: Slide[]) {
  return items.map((slide, index) => ({ ...slide, index: index + 1 }));
}

export function makeQuizSlide({
  id,
  audioKey,
  title,
  narration,
  quiz,
  activityLabel,
  visual = '🧠',
}: {
  id: string;
  audioKey: string;
  title: string;
  narration: string;
  quiz: QuizData;
  activityLabel?: string;
  visual?: string;
}): Slide {
  return {
    id,
    index: 0,
    title,
    audioKey,
    narration,
    duration: Math.max(10, Math.ceil(narration.length / 10.5)),
    kind: 'quiz',
    visual,
    timeline: emptyTimeline,
    activityLabel: activityLabel ?? `اختبار ختامي · ${quiz.questions.length} أسئلة`,
    quiz,
  };
}

export function makeChapterClosing({
  id,
  audioKey,
  title,
  narration,
  takeaways,
}: {
  id: string;
  audioKey: string;
  title: string;
  narration: string;
  takeaways: Array<{ title: string; text: string; icon: IconKey }>;
}): Slide {
  return {
    id,
    index: 0,
    title,
    audioKey,
    narration,
    duration: Math.max(10, Math.ceil(narration.length / 10.5)),
    kind: 'completion',
    visual: '🏆',
    timeline: emptyTimeline,
    content: {
      takeaways: {
        kind: 'points',
        variant: 'grid',
        items: takeaways,
      },
    },
  };
}
