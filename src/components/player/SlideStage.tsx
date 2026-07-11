import { useCallback, useEffect, useRef, useState } from 'react';
import type { Beat, BeatUnit, PptCard, Slide } from '../../types/slides';
import type { QuizQuestion } from '../../types/course';
import { Icon } from '../ui/Icon';
import { CompletionMedallion } from '../ui/Badge';
import { Confetti } from '../ui/Confetti';
import { LessonBlockView } from '../course/LessonBlocks';
import { ClassificationActivity } from '../activities/ClassificationActivity';
import { FlipCardActivity } from '../activities/FlipCardActivity';
import { DecisionSimulation } from '../activities/DecisionSimulation';
import { KnowledgeCheck } from '../activities/KnowledgeCheck';
import { POSE_SRC, type NasserPose } from '../character/Nasser';
import { SpeechBubble } from '../character/SpeechBubble';
import { toArabicDigits } from '../../lib/utils';
import { activeStoryCue } from '../../lib/storyTiming';
import { activePptCardForCue, pptCardCueIndexes } from '../../lib/pptTiming';
import { useNarrationContext } from '../audio/NarrationContext';
import { useVoiceSync } from '../../hooks/useVoiceSync';
import {
  activityCardDiscussion,
  conflictScenarioCompletion,
  conflictScenarioDiscussions,
  conflictScenarioQuestions,
  governanceFeedbackText,
  governanceQuestionText,
  quizFeedbackText,
} from '../../data/audioScripts';
import { CHECK_INTROS } from '../../data/narrationPhrases';

export interface CompletionInfo {
  percent: number;
  quizScore: number | null;
  activitiesDone: number;
  totalActivities: number;
  onRestart: () => void;
  onExit: () => void;
}

function useGuidedSpeech(slide: Slide, muted: boolean) {
  const narration = useNarrationContext();
  const [line, setLine] = useState<string | undefined>();
  const [speechKey, setSpeechKey] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const completionRef = useRef<(() => void) | null>(null);
  const lingerTimerRef = useRef<number | null>(null);
  const sync = useVoiceSync(line ?? '', speechKey ?? '', Boolean(speechKey), speechKey ?? 'guided-idle');

  useEffect(() => () => {
    if (lingerTimerRef.current != null) window.clearTimeout(lingerTimerRef.current);
  }, []);

  const clear = useCallback(() => {
    if (lingerTimerRef.current != null) window.clearTimeout(lingerTimerRef.current);
    lingerTimerRef.current = null;
    completionRef.current = null;
    setSpeechKey(null);
    setLine(undefined);
    setStarted(false);
  }, []);

  const speak = useCallback(
    (audioKey: string, text: string, onComplete: () => void) => {
      setLine(text);
      completionRef.current = onComplete;
      if (muted) {
        setStarted(true);
        completionRef.current = null;
        onComplete();
        if (lingerTimerRef.current != null) window.clearTimeout(lingerTimerRef.current);
        lingerTimerRef.current = window.setTimeout(() => {
          setLine(undefined);
          setStarted(false);
          lingerTimerRef.current = null;
        }, 1500);
        return;
      }

      setStarted(false);
      setSpeechKey(audioKey);
      narration.play(audioKey, text, slide.title);
    },
    [muted, narration, slide.audioKey, slide.title],
  );

  useEffect(() => {
    if (!speechKey || narration.nowKey !== speechKey) return;
    if (narration.isPlaying) setStarted(true);
    if (narration.completedKey === speechKey) {
      const complete = completionRef.current;
      completionRef.current = null;
      complete?.();
      if (lingerTimerRef.current != null) window.clearTimeout(lingerTimerRef.current);
      lingerTimerRef.current = window.setTimeout(() => {
        setSpeechKey(null);
        setLine(undefined);
        setStarted(false);
        lingerTimerRef.current = null;
      }, 1500);
    }
  }, [narration.completedKey, narration.isPlaying, narration.nowKey, speechKey]);

  const visibleLine = line && speechKey && started
    ? activeStoryCue(line, sync.spoken).cue?.text
    : undefined;

  return {
    line: muted && line ? line : visibleLine,
    speak,
    clear,
    speaking: Boolean(speechKey),
    started,
  };
}

// ---- Beat unit renderers -----------------------------------------------------
// Idle boxes carry a colored border + tinted emoji tile (varied accents), and the
// box currently being narrated fills VIVID GREEN with white text + a glow.

const ACCENTS = [
  { border: 'border-green-400/70', tile: 'bg-green-500/18 text-green-700' },
  { border: 'border-teal-400/70', tile: 'bg-teal-500/18 text-teal-700' },
  { border: 'border-sky-400/70', tile: 'bg-sky-500/18 text-sky-700' },
  { border: 'border-gold-400/80', tile: 'bg-gold-500/22 text-gold-700' },
];

const ACTIVE_BOX = 'border-green-600 bg-gradient-to-br from-green-500 to-green-700 shadow-glow';

type NasserGuide = {
  pose: NasserPose;
  line: string;
  side: 'left' | 'right';
  key: string;
};

function clipDialogue(text: string, _max = 112) {
  return text.replace(/\s+/g, ' ').trim();
}

function activeBeat(slide: Slide, spoken: number) {
  const beats = slide.beats ?? [];
  if (!beats.length) return null;

  let acc = 0;
  let index = 0;
  for (let i = 0; i < beats.length; i += 1) {
    if (acc <= spoken) index = i;
    acc += beats[i].text.length + 1;
  }

  return { beat: beats[index], index };
}

function pointingPose(side: 'left' | 'right'): NasserPose {
  return side === 'left' ? 'pointRight' : 'pointLeft';
}

function tabletPose(side: 'left' | 'right'): NasserPose {
  return side === 'left' ? 'tabletRight' : 'tabletLeft';
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function semanticPose(
  text: string,
  side: 'left' | 'right',
  fallback: NasserPose,
  cueIndex = 0,
): NasserPose {
  const line = text.replace(/\s+/g, ' ').trim();

  if (hasAny(line, ['أشكركم', 'حسن الاستماع', 'نلتقي', 'أتممت', 'أكملت', 'ختام الفصل'])) {
    return 'completion';
  }
  if (hasAny(line, ['السلام عليكم', 'حياكم الله', 'معكم ناصر', 'بسم الله نبدأ'])) {
    return 'welcome';
  }
  if (hasAny(line, ['ممتاز', 'اختيارك صحيح', 'إجابة صحيحة', 'أحسنت', 'بشكل صحيح'])) {
    return 'success';
  }
  if (
    line.includes('؟') ||
    hasAny(line, ['السؤال', 'فكر', 'اختر', 'صنّف', 'صنف', 'هل هذا', 'هل يكفي', 'ما نوع', 'لماذا', 'كيف نضمن'])
  ) {
    return 'question';
  }
  if (hasAny(line, ['خلنا نراجع', 'نراجعها معًا', 'نحلل', 'نناقش', 'نقاط النقاش', 'تأمل', 'قارن'])) {
    return 'thinking';
  }
  if (
    hasAny(line, [
      'خطر',
      'مخالفة',
      'إخلال',
      'استغلال نفوذ',
      'غير صحيح',
      'لا يكفي',
      'رشوة',
      'تعارض فيها',
      'تضارب مصالح فعلي',
    ])
  ) {
    return 'warning';
  }
  if (
    hasAny(line, [
      'أولًا',
      'ثانيًا',
      'ثالثًا',
      'رابعًا',
      'خامسًا',
      'سادسًا',
      'الإطار',
      'الخطوات',
      'المكونات',
      'السياسة',
      'الإجراء الصحيح',
      'نظام ',
      'وثيقة',
      'التوثيق',
      'مصفوفة الصلاحيات',
    ])
  ) {
    return tabletPose(side);
  }
  if (hasAny(line, ['التكامل', 'استدامة', 'يحميان المنشأة', 'يبني ثقة', 'القدوة من القيادة'])) {
    return 'success';
  }

  if (fallback !== 'welcome') return fallback;
  return cueIndex % 3 === 1 ? tabletPose(side) : pointingPose(side);
}

function contentPose(slide: Slide, beat: Beat | undefined, beatIndex: number, side: 'left' | 'right'): NasserPose {
  const unit = beat?.unit;
  const fallback = !unit || unit.t === 'title'
    ? beatIndex % 2 === 0 ? 'welcome' : pointingPose(side)
    : unit.t === 'def'
      ? tabletPose(side)
      : unit.t === 'callout'
        ? unit.tone === 'contrast' ? 'success' : 'thinking'
        : [6, 7, 8, 10, 11].includes(slide.index) && beatIndex % 2 === 0
          ? tabletPose(side)
          : beatIndex % 3 === 0 ? tabletPose(side) : pointingPose(side);
  return semanticPose(beat?.text ?? slide.title, side, fallback, beatIndex);
}

function nasserGuide(slide: Slide, spoken: number): NasserGuide {
  if (slide.layout?.startsWith('ppt')) {
    const { cue, index } = activeStoryCue(slide.narration, spoken);
    const side: 'left' | 'right' = slide.index % 2 === 0 ? 'left' : 'right';
    return {
      pose: semanticPose(cue.text, side, index % 2 === 0 ? pointingPose(side) : tabletPose(side), index),
      side,
      key: `ppt-${slide.id}-${index}`,
      line: clipDialogue(cue.text, 132),
    };
  }

  if (slide.kind === 'content') {
    const active = activeBeat(slide, spoken);
    const side: 'left' | 'right' = slide.index % 3 === 0 ? 'right' : 'left';
    return {
      pose: contentPose(slide, active?.beat, active?.index ?? 0, side),
      side,
      key: `beat-${active?.index ?? 0}`,
      line: clipDialogue(active?.beat?.text ?? slide.title),
    };
  }

  const { cue, index } = activeStoryCue(slide.narration, spoken);

  if (slide.kind === 'welcome') {
    const side: 'left' | 'right' = 'right';
    return {
      pose: semanticPose(cue.text, side, index === 0 ? 'welcome' : pointingPose(side), index),
      side,
      key: `welcome-${index}`,
      line: clipDialogue(cue.text, 126),
    };
  }
  if (slide.kind === 'quiz') {
    const side: 'left' | 'right' = 'left';
    return {
      pose: semanticPose(cue.text, side, index === 0 ? 'question' : 'thinking', index),
      side,
      key: `quiz-${index}`,
      line: clipDialogue(cue.text),
    };
  }
  if (slide.kind === 'reflection') {
    const side: 'left' | 'right' = 'right';
    return {
      pose: semanticPose(cue.text, side, index === 0 ? 'thinking' : pointingPose(side), index),
      side,
      key: `reflection-${index}`,
      line: clipDialogue(cue.text),
    };
  }
  if (slide.kind === 'completion') {
    const side: 'left' | 'right' = 'right';
    return {
      pose: semanticPose(cue.text, side, index === 0 ? 'success' : 'completion', index),
      side,
      key: `completion-${index}`,
      line: clipDialogue(cue.text, 126),
    };
  }
  if (slide.kind === 'activity') {
    const side: 'left' | 'right' = slide.activity?.kind === 'classification' ? 'right' : 'left';
    const fallback = slide.activity?.kind === 'scenarioDecision'
      ? index === 0 ? 'warning' : 'thinking'
      : slide.activity?.kind === 'flipCards'
        ? index === 0 ? 'thinking' : tabletPose(side)
        : index === 0 ? 'question' : 'thinking';

    return {
      pose: semanticPose(cue.text, side, fallback, index),
      side,
      key: `activity-${index}`,
      line: clipDialogue(cue.text),
    };
  }

  return {
    pose: pointingPose('left'),
    side: 'left',
    key: 'fallback',
    line: clipDialogue(slide.narration),
  };
}

function NasserStoryLayer({
  slide,
  spoken,
  showDialogue,
  dialogueOverride,
}: {
  slide: Slide;
  spoken: number;
  showDialogue: boolean;
  dialogueOverride?: string;
}) {
  const guide = nasserGuide(slide, spoken);
  const line = dialogueOverride ?? guide.line;
  // Split the active cue at the real spoken position (from the audio clock)
  // so the bubble reveals word by word in step with the voice instead of
  // popping the whole sentence in at once. Only meaningful for the main
  // narration line — a dialogueOverride (guided Q&A) already resolves to a
  // plain string with its own sync, so it renders as a single block.
  const cueSpokenSplit = !dialogueOverride
    ? (() => {
        const { cue } = activeStoryCue(slide.narration, spoken);
        if (!cue) return null;
        const relative = Math.max(0, Math.min(cue.text.length, spoken - cue.start));
        return { spokenPart: cue.text.slice(0, relative), remainingPart: cue.text.slice(relative) };
      })()
    : null;
  const isPpt = Boolean(slide.layout?.startsWith('ppt'));
  const isQuiz = slide.kind === 'quiz';
  const compact = isPpt || slide.kind === 'activity' || slide.kind === 'quiz' || slide.kind === 'reflection';
  const imageSize = isPpt
    ? 'h-[218px] w-[218px]'
    : isQuiz
      ? 'h-[160px] w-[160px]'
      : compact
        ? 'h-[200px] w-[200px]'
        : 'h-[250px] w-[250px]';
  const layerHeight = isPpt ? 'h-[190px]' : isQuiz ? 'h-[140px]' : compact ? 'h-[178px]' : 'h-[212px]';
  const bottomOffset = isPpt ? 'bottom-[14px]' : isQuiz ? 'bottom-[18px]' : 'bottom-[38px]';
  const rowDirection = guide.side === 'right' ? 'flex-row-reverse' : 'flex-row';
  const justify = guide.side === 'right' ? 'justify-end' : 'justify-start';
  const bubbleLift = isQuiz ? 'mb-2' : compact ? 'mb-5' : 'mb-9';
  const bubbleTail = guide.side === 'right' ? 'left' : 'right';
  const speakingPose = semanticPose(line, guide.side, guide.pose);
  const displayPose = isPpt && !showDialogue ? 'welcome' : speakingPose;
  const stripDiacritics = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '');
  const displayLine = stripDiacritics(line);
  const displaySpokenPart = cueSpokenSplit ? stripDiacritics(cueSpokenSplit.spokenPart) : displayLine;
  const displayRemainingPart = cueSpokenSplit ? stripDiacritics(cueSpokenSplit.remainingPart) : '';

  return (
    <div className={`pointer-events-none absolute inset-x-0 ${bottomOffset} z-30 ${layerHeight} overflow-visible px-7 pb-3`}>
      <div className={`flex h-full w-full items-end ${justify}`}>
        <div className={`flex max-w-[980px] items-end gap-3 ${rowDirection}`}>
          <img
            key={displayPose}
            src={POSE_SRC[displayPose]}
            alt="ناصر المدرب"
            className={`${imageSize} shrink-0 object-contain object-bottom drop-shadow-2xl`}
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 78%, rgb(0 0 0 / 0.72) 90%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 0%, #000 78%, rgb(0 0 0 / 0.72) 90%, transparent 100%)',
            }}
            draggable={false}
          />
          {showDialogue && (
            <div className={bubbleLift}>
              <SpeechBubble
                text={displaySpokenPart}
                remainingText={displayRemainingPart}
                tailTo={bubbleTail}
                compact={compact}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SLIDE_ORNAMENTS: Record<string, readonly string[]> = {
  'ppt-intro': ['🏥', '🛡️', '⚖️', '🎓', '📘', '✨', '🧭', '🤝'],
  'ppt-governance-models': ['🏛️', '🧭', '👥', '🗂️', '📊', '🔗', '⚙️', '✅'],
  'ppt-framework': ['🧩', '🧱', '⚙️', '📋', '🎯', '🔄', '📊', '🛡️'],
  'ppt-governance-compliance': ['🏛️', '✅', '🤝', '🛡️', '📈', '🧭', '🔍', '⚙️'],
  'ppt-activity-governance-or-compliance': ['🧠', '🗳️', '🔍', '✅', '📋', '💡', '🎯', '🤝'],
  'ppt-ethics-conflict': ['⚖️', '🤝', '🔎', '🛡️', '📣', '🏥', '📜', '✅'],
  'ppt-conflict-scenario': ['🔍', '⚠️', '💡', '🛡️', '🧭', '📋', '⚖️', '✅'],
  'ppt-conclusion': ['🎯', '✅', '🏆', '✨', '🎓', '🤝', '📘', '🛡️'],
};

/** Picks the ornament's floating icon set. Prefers icons drawn straight from
 *  the slide's own cards (via pptEmojiFor, defined further below — hoisted)
 *  so the decoration next to Nasser actually reflects what he's saying,
 *  instead of an arbitrary/generic symbol set. */
function ornamentSymbolsFor(slide: Slide): string[] {
  const cards = slide.ppt?.cards;
  if (cards && cards.length >= 2) {
    const derived = cards.map((card, i) => pptEmojiFor(card, slide.visual, i));
    const pool = Array.from(new Set(derived));
    if (slide.visual && !pool.includes(slide.visual)) pool.unshift(slide.visual);
    const out: string[] = [];
    for (let i = 0; i < 8; i++) out.push(pool[i % pool.length]);
    return out;
  }
  return [...(SLIDE_ORNAMENTS[slide.id] ?? [slide.visual ?? '✨', '✦', '•'])];
}

const ORNAMENT_ANIMS = ['animate-scale-in', 'animate-fade-up', 'animate-zoom', 'animate-rise', 'animate-pop', 'animate-swing-in'];

/** Deterministic-but-shuffled pick: same cue always lands on the same
 *  animation (no flicker on re-render), but consecutive cues jump around
 *  the list instead of cycling in a visible 1-2-3-1-2-3 pattern. */
function pseudoShuffle(seed: number, length: number) {
  return Math.abs((seed * 2654435761) % 2147483647) % length;
}

/** Picks the emoji that best matches the *exact sentence* Nasser is saying
 *  right now (via the same keyword dictionary used for card icons — defined
 *  further below, hoisted), not just a per-slide pool. Falls back to the
 *  slide's card-derived pool when the sentence has no direct keyword hit. */
function emojiForCueText(cueText: string, fallback: string) {
  const match = PPT_EMOJIS.find((item) => item.terms.some((term) => cueText.includes(term)));
  return match?.emoji ?? fallback;
}

/** One clear, deliberate icon (+ a small companion badge) instead of a
 *  cluster of eight — sized continuously by how much of the canvas is
 *  still empty *right now*. Anchored to the same bottom-side spot beside
 *  Nasser throughout, so as fewer cards are revealed it simply grows
 *  upward and fills the open space; as each card lands it shrinks back
 *  down step by step, like a shot reframing as new elements enter rather
 *  than a static sticker at one fixed size. The icon itself changes with
 *  every sentence to match what Nasser is actually saying, each time with
 *  a different, shuffled entrance animation. */
function ContextOrnament({
  slide,
  spoken,
  revealedCount,
}: {
  slide: Slide;
  spoken: number;
  revealedCount?: number;
}) {
  // The bag/chapter intro gets its own motion-graphics scene instead.
  if (slide.layout === 'pptIntro') return null;
  const guide = nasserGuide(slide, spoken);
  const cueState = activeStoryCue(slide.narration, spoken);
  const cueIndex = cueState.index;
  const symbols = ornamentSymbolsFor(slide);
  const fallbackPrimary = symbols[cueIndex % symbols.length];
  const primary = emojiForCueText(cueState.cue?.text ?? '', fallbackPrimary);
  const secondary = symbols[(cueIndex + 1) % symbols.length];
  const anim = ORNAMENT_ANIMS[pseudoShuffle(cueIndex + slide.id.length, ORNAMENT_ANIMS.length)];

  const cardCount = slide.ppt?.cards?.length ?? 0;
  // Slides with no `ppt.cards` aren't necessarily empty — quiz questions,
  // knowledge checks, the classification/decision/flip-card activities, AND
  // the bag/chapter intro (a centered text box + button) all have real
  // content the ornament must stay clear of. None of them get the old
  // "roomy, keeps growing" treatment; the intro just gets a fixed, modest
  // size since it has no card-reveal progression to shrink from anyway.
  const isIntroStatic = cardCount === 0 && slide.kind === 'welcome';
  // 1 = canvas still empty (few cards revealed) → 0 = fully populated. Only
  // meaningful once there's an actual card grid to reveal.
  const openness = cardCount > 0 ? 1 - Math.min(1, (revealedCount ?? cardCount) / cardCount) : 0;
  const baseline = cardCount > 0 && cardCount <= 3
    ? { wrap: 200, primaryBox: 144, primaryText: 76, secondaryBox: 56, secondaryText: 28 }
    : cardCount === 4
      ? { wrap: 180, primaryBox: 128, primaryText: 68, secondaryBox: 50, secondaryText: 25 }
      : { wrap: 160, primaryBox: 112, primaryText: 58, secondaryBox: 44, secondaryText: 22 };
  const grow = 1 + openness * 0.5; // up to +50% bigger while its own cards are still revealing
  const size = isIntroStatic
    ? { wrap: 190, primaryBox: 138, primaryText: 72, secondaryBox: 52, secondaryText: 26 }
    : {
        wrap: Math.round(baseline.wrap * grow),
        primaryBox: Math.round(baseline.primaryBox * grow),
        primaryText: Math.round(baseline.primaryText * grow),
        secondaryBox: Math.round(baseline.secondaryBox * grow),
        secondaryText: Math.round(baseline.secondaryText * grow),
      };

  // Nasser's flex alignment is logical in the RTL canvas: guide.left renders
  // physically on the right, so the matching physical opposite is also left.
  const ornamentSide = guide.side;
  const sideOffset = ornamentSide === 'left' ? { left: 28 } : { right: 28 };

  return (
    <div
      key={`${slide.id}-${cueIndex}-${primary}`}
      className={`pointer-events-none absolute bottom-[42px] z-0 ${anim} transition-[height,width] duration-500 ease-out`}
      style={{ ...sideOffset, height: size.wrap, width: size.wrap }}
      data-ornament-side={ornamentSide}
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 m-auto rounded-full border border-dashed border-green-700/25"
        style={{ height: size.primaryBox + 44, width: size.primaryBox + 44 }}
      />
      <span
        className="absolute inset-0 m-auto grid place-items-center rounded-full border-[3px] border-white bg-white/95 shadow-card-lg ring-2 ring-green-600/25"
        style={{ height: size.primaryBox, width: size.primaryBox, fontSize: size.primaryText }}
      >
        {primary}
        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-[3px] border-white bg-gold-400" />
      </span>
      <span
        className="absolute bottom-0 left-0 grid -rotate-[8deg] place-items-center rounded-full border-2 border-white bg-green-50/95 shadow-card ring-1 ring-green-600/20"
        style={{ height: size.secondaryBox, width: size.secondaryBox, fontSize: size.secondaryText }}
      >
        {secondary}
      </span>
    </div>
  );
}
void ContextOrnament;

function StorySlideShell({
  slide,
  spoken,
  showDialogue,
  dialogueOverride,
  revealedCount,
  children,
}: {
  slide: Slide;
  spoken: number;
  showDialogue: boolean;
  dialogueOverride?: string;
  /** How many of the slide's cards are currently revealed — lets the
   *  ornament fill the still-empty canvas before the first card appears. */
  revealedCount?: number;
  children: React.ReactNode;
}) {
  const isPpt = Boolean(slide.layout?.startsWith('ppt'));
  const isQuiz = slide.kind === 'quiz';
  const compact = slide.kind === 'activity' || slide.kind === 'quiz' || slide.kind === 'reflection' || slide.kind === 'completion';
  // The intro/roadmap hero scenes compose their own full-bleed illustration
  // and place their own CTA button — they don't need the full Nasser-height
  // reservation every other ppt slide gets, and that reserved band was
  // leaving a large dead zone under the visual on the right (Nasser only
  // occupies the left). Give them most of that space back.
  const isIntroMotion = slide.layout === 'pptIntro' || slide.id === 'program-map';
  const bottomSpace = isIntroMotion ? 'pb-[104px]' : isPpt ? 'pb-[232px]' : isQuiz ? 'pb-[172px]' : compact ? 'pb-[254px]' : 'pb-[292px]';
  const topSpace = isIntroMotion ? 'pt-[64px]' : isPpt ? 'pt-[86px]' : isQuiz ? 'pt-[68px]' : compact ? 'pt-[92px]' : 'pt-[106px]';
  void revealedCount;

  return (
    <div className="relative isolate h-full overflow-hidden">
      <div className={`relative z-10 h-full px-[70px] ${topSpace} ${bottomSpace}`}>{children}</div>
      <NasserStoryLayer slide={slide} spoken={spoken} showDialogue={showDialogue} dialogueOverride={dialogueOverride} />
    </div>
  );
}

function UnitView({ unit, active, accent }: { unit: BeatUnit; active: boolean; accent: number }) {
  const a = ACCENTS[accent % ACCENTS.length];
  const shell = `rounded-2xl border-2 shadow-card transition-all duration-300 ${
    active ? ACTIVE_BOX : `${a.border} bg-surface`
  }`;
  const tile = active ? 'bg-white/25 text-white' : a.tile;

  switch (unit.t) {
    case 'lead':
      return (
        <p
          className={`mx-auto inline-block rounded-2xl border-2 px-6 py-3 text-center text-[22px] font-extrabold leading-relaxed shadow-card transition-all duration-300 ${
            active ? `${ACTIVE_BOX} text-white` : `${a.border} bg-surface text-ink`
          }`}
        >
          {unit.text}
        </p>
      );
    case 'def':
      return (
        <div className={`${shell} flex items-start gap-4 p-5`}>
          <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl p-2 ${tile}`}>
            <CourseGlyph kind={courseGlyphKind(`${unit.term} ${unit.text}`)} active={active} />
          </span>
          <div>
            <h3 className={`mb-1 text-[22px] font-extrabold ${active ? 'text-white' : 'text-brand-strong'}`}>
              {unit.term}
            </h3>
            <p className={`text-[20px] font-semibold leading-relaxed ${active ? 'text-green-50' : 'text-ink-soft'}`}>
              {unit.text}
            </p>
          </div>
        </div>
      );
    case 'point':
      return (
        <div className={`${shell} flex min-h-[64px] items-center gap-3 p-3.5`}>
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl p-2 ${tile}`}>
            <CourseGlyph kind={courseGlyphKind(`${unit.title ?? ''} ${unit.text ?? ''}`)} active={active} />
          </span>
          <div className="min-w-0">
            {unit.title && (
              <p className={`text-[20px] font-extrabold leading-tight ${active ? 'text-white' : 'text-ink'}`}>
                {unit.title}
              </p>
            )}
            {unit.text && (
              <p className={`text-[18px] font-semibold leading-relaxed ${active ? 'text-green-50' : 'text-ink-soft'}`}>
                {unit.text}
              </p>
            )}
          </div>
        </div>
      );
    case 'callout': {
      const isContrast = unit.tone === 'contrast';
      const cls = isContrast
        ? 'border-green-600 bg-gradient-to-l from-green-800 to-green-600 text-white'
        : active
          ? `${ACTIVE_BOX} text-white`
          : unit.tone === 'gold'
            ? 'border-gold-400/70 bg-gold-500/10'
            : 'border-teal-400/70 bg-teal-500/10';
      const titleCls = isContrast || active ? 'text-white' : 'text-ink';
      const textCls = isContrast || active ? 'text-green-50' : 'text-ink-soft';
      return (
        <div className={`min-h-[64px] rounded-2xl border-2 p-4 shadow-card transition-all duration-300 ${cls}`}>
          {unit.title && <p className={`mb-1 text-[22px] font-extrabold ${titleCls}`}>{unit.title}</p>}
          <p className={`text-[20px] font-semibold leading-relaxed ${textCls}`}>{unit.text}</p>
        </div>
      );
    }
    default:
      return null;
  }
}

function BeatBox({
  beat,
  revealed,
  active,
  accent,
}: {
  beat: Beat;
  revealed: boolean;
  active: boolean;
  accent: number;
}) {
  return (
    <div
      className={`transition-transform duration-300 ${revealed ? `animate-${beat.anim}` : 'opacity-0'} ${
        active ? 'scale-[1.04] z-10' : ''
      }`}
    >
      <UnitView unit={beat.unit} active={active} accent={accent} />
    </div>
  );
}

// ---- Content (beat) slide --------------------------------------------------

/** Concentric target/bullseye + arrow — for the roadmap slide (like the client). */
/** Always-present side graphic: an emoji "image" panel or the target. Alternates
 *  bubble shape / gradient angle per slide so consecutive slides don't look identical. */
function SideVisual({ slide, alt }: { slide: Slide; alt: boolean }) {
  const glyphKind = courseGlyphKind(`${slide.title} ${slide.narration}`);
  return (
    <div
      className={`relative grid h-full w-[220px] shrink-0 place-items-center overflow-hidden ${
        alt ? 'rounded-[2.5rem]' : 'rounded-3xl'
      } border-2 border-green-500/35 shadow-card-lg ${
        alt
          ? 'bg-gradient-to-tr from-teal-600/28 via-green-500/24 to-green-700/30'
          : 'bg-gradient-to-br from-green-500/30 via-teal-500/22 to-green-700/28'
      }`}
    >
      <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-green-400/40 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-gold-400/30 blur-3xl" />
      <div
        className="absolute inset-0 opacity-50"
        style={{ backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.35) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
      />
      <div
        className={`relative grid h-36 w-36 place-items-center bg-white/90 p-6 shadow-card-lg animate-float ring-4 ring-white/40 ${
          alt ? 'rounded-[2rem]' : 'rounded-full'
        }`}
      >
        <CourseGlyph kind={glyphKind} />
      </div>
    </div>
  );
}

/** Numbered circle node — for genuinely sequential steps. */
function NumberNode({ n, active }: { n: number; active: boolean }) {
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-extrabold text-white shadow-card ring-4 ring-surface transition-transform ${
        active ? 'scale-110 bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-green-400 to-teal-600'
      }`}
    >
      {toArabicDigits(n)}
    </span>
  );
}

/** Small diamond marker — for parallel / non-ordered items (no number implied). */
function ShapeNode({ active }: { active: boolean }) {
  return (
    <span
      className={`grid h-9 w-9 shrink-0 rotate-45 place-items-center rounded-xl shadow-card ring-4 ring-surface transition-transform ${
        active ? 'scale-110 bg-gradient-to-br from-green-500 to-green-700' : 'bg-gradient-to-br from-teal-400 to-sky-500'
      }`}
    >
      <span className="block h-2 w-2 -rotate-45 rounded-full bg-white" />
    </span>
  );
}

function BeatSlide({ slide, spoken, showDialogue }: { slide: Slide; spoken: number; showDialogue: boolean }) {
  const beats = slide.beats ?? [];
  const total = slide.narration.length || 1;

  const offsets: number[] = [];
  let acc = 0;
  for (const b of beats) {
    offsets.push(acc);
    acc += b.text.length + 1;
  }
  const revealed = (i: number) => offsets[i] <= spoken;
  let through = 0;
  for (let i = 0; i < beats.length; i++) if (offsets[i] <= spoken) through = i;
  const activeIdx = spoken < total ? through : -1;

  const bodyBeats = beats.map((b, i) => ({ b, i })).filter((x) => x.b.unit.t !== 'title');

  // Visual variety knobs, derived from the slide's position (deterministic, no flicker).
  const alt = slide.index % 2 === 0;
  const mirror = slide.index % 3 === 0; // occasionally swap which side the visual sits on
  const spineDashed = slide.index % 2 === 0;
  const topFlow = slide.index % 4 === 1;

  // Running number counter — only 'number'-marked beats consume a digit, so a
  // mix of numbered steps and small-shape items can coexist naturally.
  let numCounter = 0;

  const visual = <SideVisual slide={slide} alt={alt} />;
  const compactVisual = (
    <div className="relative flex h-32 min-w-[220px] flex-1 items-end justify-between overflow-hidden rounded-3xl border-2 border-green-500/30 bg-gradient-to-l from-green-500/18 via-teal-500/12 to-gold-500/14 px-5 shadow-card">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(rgb(20 160 120 / 0.35) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="relative z-10 flex items-center gap-4 self-center">
        <span className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-white/90 p-3 shadow-card ring-4 ring-white/40">
          <CourseGlyph kind={courseGlyphKind(`${slide.title} ${slide.narration}`)} />
        </span>
        <span className="max-w-[360px] text-right text-lg font-extrabold leading-snug text-brand-strong">
          {slide.title}
        </span>
      </div>
    </div>
  );

  const flowRows = bodyBeats.map(({ b, i }) => {
    const active = activeIdx === i;
    const isShape = b.marker === 'shape';
    if (!isShape) numCounter++;
    const node = isShape ? <ShapeNode active={active} /> : <NumberNode n={numCounter} active={active} />;
    const connector = <span className={`h-0.5 w-4 shrink-0 rounded ${active ? 'bg-green-600' : 'bg-brand/40'}`} />;
    const content = (
      <div className="min-w-0 flex-1">
        <BeatBox beat={b} revealed={revealed(i)} active={active} accent={i} />
      </div>
    );
    return (
      <div key={i} className="relative z-10 flex items-center gap-2.5">
        {mirror ? (
          <>
            {content}
            {connector}
            {node}
          </>
        ) : (
          <>
            {node}
            {connector}
            {content}
          </>
        )}
      </div>
    );
  });

  const verticalFlow = (
    <div className="relative flex min-h-0 flex-1 flex-col justify-center gap-3">
      {/* connecting spine */}
      <span
        className={`absolute bottom-7 top-7 z-0 w-1 rounded-full bg-gradient-to-b from-green-500/60 via-teal-500/55 to-gold-500/55 ${
          mirror ? 'left-[19px]' : 'right-[19px]'
        } ${spineDashed ? 'opacity-70 [background-image:repeating-linear-gradient(180deg,rgb(20_160_120/0.6)_0_10px,transparent_10px_18px)] [background-color:transparent]' : ''}`}
      />
      {flowRows}
    </div>
  );

  const topDownFlow = (
    <div className="relative grid min-h-0 flex-1 grid-cols-2 content-center gap-3.5">
      <span className="absolute left-6 right-6 top-1/2 z-0 h-1 -translate-y-1/2 rounded-full bg-gradient-to-l from-green-500/55 via-teal-500/45 to-gold-500/50" />
      {flowRows}
    </div>
  );

  return (
    <StorySlideShell slide={slide} spoken={spoken} showDialogue={showDialogue}>
      <div className="flex h-full flex-col px-9 py-5">
      {/* title (beat 0) */}
      <h2 className={`flex items-center gap-3 text-[30px] font-extrabold leading-tight transition-colors ${activeIdx === 0 ? 'text-brand' : 'text-brand-strong'}`}>
      <span className={`grid h-14 w-14 shrink-0 place-items-center bg-gradient-to-br from-green-500 to-teal-600 p-2 text-white shadow-card ${alt ? 'rounded-full' : 'rounded-2xl'}`}>
          <CourseGlyph kind={courseGlyphKind(`${slide.title} ${slide.narration}`)} active compact />
        </span>
        {slide.title}
      </h2>

      {topFlow ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
          {compactVisual}
          {topDownFlow}
        </div>
      ) : (
        <div className={`mt-4 flex min-h-0 flex-1 items-stretch gap-5 ${mirror ? 'flex-row-reverse' : ''}`}>
          {visual}
          {verticalFlow}
        </div>
      )}
      </div>
    </StorySlideShell>
  );
}

// ---- PowerPoint-matched chapter slides -------------------------------------

const PPT_ACCENTS: Record<NonNullable<PptCard['tone']>, string> = {
  green: 'border-green-600/30 bg-white',
  gold: 'border-gold-500/45 bg-gold-50/80',
  blue: 'border-sky-500/35 bg-sky-50/80',
  gray: 'border-slate-300 bg-white',
};
void PPT_ACCENTS;

const PPT_EMOJIS = [
  { terms: ['سيناريو'], emoji: '🎬' },
  { terms: ['مخالفة', 'تعارض'], emoji: '⚠️' },
  { terms: ['الإجراء الصحيح', 'صحيح'], emoji: '✅' },
  { terms: ['نقاط للنقاش', 'نقاش'], emoji: '💬' },
  { terms: ['أسئلة', 'سؤال'], emoji: '❓' },
  { terms: ['أخلاقيات', 'نزاهة', 'حياد', 'عدالة'], emoji: '⚖️' },
  { terms: ['تضارب', 'مصالح'], emoji: '⚠️' },
  { terms: ['امتثال', 'التطبيق', 'ضوابط قابلة للقياس'], emoji: '✅' },
  { terms: ['حوكمة', 'الإطار'], emoji: '🏛️' },
  { terms: ['مجلس'], emoji: '🧭' },
  { terms: ['دفاع'], emoji: '🛡️' },
  { terms: ['لجان', 'لجنة'], emoji: '👥' },
  { terms: ['مصفوفة', 'صلاحيات', 'DoA'], emoji: '🗂️' },
  { terms: ['سياسات', 'وثيقة', 'دليل الامتثال', 'مدونة السلوك'], emoji: '📜' },
  { terms: ['إجراءات', 'ممارسة'], emoji: '⚙️' },
  { terms: ['بيانات'], emoji: '🗄️' },
  { terms: ['موارد', 'بشرية'], emoji: '👥' },
  { terms: ['تدريب', 'توعية', 'أدوات التوعية'], emoji: '🎓' },
  { terms: ['صحي', 'مستشفى', 'طبيب', 'أطباء', 'مرضى'], emoji: '🏥' },
  { terms: ['إفصاح'], emoji: '📣' },
  { terms: ['توثيق'], emoji: '📝' },
  { terms: ['رؤية 2030', 'تحول'], emoji: '🚀' },
  { terms: ['اعتماد', 'جودة'], emoji: '🏅' },
  { terms: ['تدقيق', 'اختبار حقيقة الضوابط', 'اختبار الضوابط'], emoji: '🔍' },
  { terms: ['التخطيط', 'Plan', 'تخطيط المراقبة'], emoji: '🗓️' },
  { terms: ['التنفيذ', 'Do'], emoji: '⚙️' },
  { terms: ['التحقق', 'Check', 'اختبار فهمك'], emoji: '🔎' },
  { terms: ['الاستجابة', 'Act', 'تحسين مستمر'], emoji: '🔁' },
  { terms: ['قيادة', 'القيادة'], emoji: '🧑‍💼' },
  { terms: ['استدامة'], emoji: '🌱' },
  { terms: ['فجوة', 'فجوات'], emoji: '🧩' },
  { terms: ['خطة عمل', 'خطة العمل'], emoji: '🗺️' },
  { terms: ['تحليل المخاطر', 'تحليل وإدارة المخاطر'], emoji: '🔬' },
  { terms: ['تقييم المخاطر', 'تقييم الذاتي'], emoji: '📐' },
  { terms: ['معالجة المخاطر', 'معالجة'], emoji: '🧯' },
  { terms: ['المراقبة والمراجعة', 'مراجعة'], emoji: '🗒️' },
  { terms: ['سجل المخاطر', 'Risk Register', 'سجل'], emoji: '📊' },
  { terms: ['الكامن'], emoji: '🔥' },
  { terms: ['المتبقي'], emoji: '🌡️' },
  { terms: ['مؤشرات المخاطر', 'KRI', 'مؤشرات'], emoji: '📈' },
  { terms: ['تقارير', 'تقرير'], emoji: '📄' },
  { terms: ['أيزو', 'ISO', 'المبادئ الثمانية'], emoji: '🏷️' },
  { terms: ['النطاق', 'السياق', 'المعايير'], emoji: '🎯' },
  { terms: ['استراتيجية'], emoji: '♟️' },
  { terms: ['خطر', 'مخاطر'], emoji: '🛡️' },
];

const PPT_EMOJI_VARIANTS: Record<string, string[]> = {
  '🏛️': ['🏛️', '🧭', '🗂️', '👥', '🔗', '🛡️'],
  '✅': ['✅', '🔍', '📋', '📊', '🛡️', '⚙️'],
  '⚖️': ['⚖️', '🤝', '📣', '✨', '🧭', '🏥'],
  '⚠️': ['⚠️', '🚦', '🔎', '🧯'],
  '👥': ['👥', '🤝', '🧑‍💼', '🏢'],
};

const PPT_REVEAL_ANIMS = ['animate-fade-up', 'animate-slide-in', 'animate-scale-in', 'animate-rise'];

function pptEmojiFor(card: PptCard, fallback?: string, index = 0) {
  const text = `${card.title} ${card.text ?? ''}`;
  const match = PPT_EMOJIS.find((item) => item.terms.some((term) => text.includes(term)));
  const base = match?.emoji ?? fallback ?? '💡';
  const variants = PPT_EMOJI_VARIANTS[base];
  return variants?.[index % variants.length] ?? base;
}

/** Hand-picked vector emblem per intro slide — matches each chapter's own
 *  theme (institutional structure, protection, balance/risk) rather than a
 *  generic icon. */
function pptDetailFor(card: PptCard) {
  if (card.rationale) return card.rationale;
  const text = `${card.title} ${card.text ?? ''}`;
  if (text.includes('حوكمة') || text.includes('الإطار')) {
    return 'حدد صاحب القرار، جهة المراجعة، ودليل التوثيق.';
  }
  if (text.includes('امتثال') || text.includes('التطبيق')) {
    return 'حول المتطلب إلى ضابط قابل للقياس وتابع الفجوة.';
  }
  if (text.includes('أخلاقيات') || text.includes('نزاهة') || text.includes('تضارب')) {
    return 'تحقق من الحياد والإفصاح وتوثيق المعالجة.';
  }
  if (text.includes('سيناريو') || text.includes('مخالفة')) {
    return 'اربط الحالة بالمخاطر ثم اختر الإجراء الأنسب.';
  }
  if (text.includes('مجلس') || text.includes('لجنة') || text.includes('لجان')) {
    return 'ميز بين التوجيه والتنفيذ والرقابة.';
  }
  return 'اربط النقطة بموقف عملي وحدد المسؤولية ودليل التحقق.';
}

type CheckPhase = 'idle' | 'asking' | 'ready' | 'revealed' | 'done';

/** A question Nasser raises verbally only after he finishes explaining the
 *  slide: a centered popup over the canvas (never silent text sitting beside
 *  him). He introduces + asks it aloud, the popup fades in while he talks,
 *  and once the learner clicks he speaks the correct answer and explains it. */
function PptQuickCheckPopup({
  check,
  phase,
  onReveal,
  onDismiss,
}: {
  check: PptCard;
  phase: CheckPhase;
  onReveal: () => void;
  onDismiss: () => void;
}) {
  if (phase === 'idle' || phase === 'done') return null;
  const revealed = phase === 'revealed';
  const ready = phase === 'ready';
  return (
    <div className="absolute inset-0 z-20 grid place-items-start pt-[64px]" aria-live="polite">
      {/* Once Nasser has answered, tapping anywhere outside the card dismisses
          it and returns to the normal slide view — only active post-reveal
          so the learner can't skip past the question itself. */}
      <div
        className={`absolute inset-0 bg-ink/35 backdrop-blur-[2px] animate-fade-in ${revealed ? 'cursor-pointer' : 'pointer-events-none'}`}
        onClick={revealed ? onDismiss : undefined}
      />
      <div
        className={`pointer-events-auto relative mx-auto w-full max-w-[720px] animate-scale-in overflow-hidden rounded-2xl border-2 shadow-card-lg transition-colors duration-500 ${
          revealed
            ? 'border-green-700 bg-gradient-to-br from-green-700 to-green-600 text-white'
            : 'border-gold-500/60 bg-white text-ink'
        }`}
      >
        <div className={`flex items-center gap-2 border-b px-5 py-2.5 ${revealed ? 'border-white/20 bg-white/10' : 'border-gold-500/25 bg-gold-50'}`}>
          <span className="text-[20px]">{revealed ? '✅' : phase === 'asking' ? '🎙️' : '🤔'}</span>
          <span className={`text-[13px] font-extrabold ${revealed ? 'text-white' : 'text-green-800'}`}>
            سؤال ناصر التفاعلي
          </span>
        </div>
        <div className="px-6 py-5 text-center">
          <h3 className={`text-[24px] font-extrabold leading-snug ${revealed ? 'text-white' : 'text-brand-strong'}`}>
            {revealed ? check.answer : check.title}
          </h3>
          <p className={`mt-2 text-[16px] font-bold leading-relaxed ${revealed ? 'text-green-50' : 'text-ink-soft'}`}>
            {revealed ? check.rationale : check.text}
          </p>
        </div>
        {!revealed ? (
          <div className="flex justify-center pb-5">
            <button
              type="button"
              disabled={!ready}
              onClick={onReveal}
              className="rounded-lg bg-green-700 px-6 py-3 text-[16px] font-extrabold text-white shadow-card transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {ready ? 'فكّرت.. اكشف الإجابة' : 'استمع للسؤال…'}
            </button>
          </div>
        ) : (
          <div className="flex justify-center pb-4">
            <button type="button" onClick={onDismiss} className="text-[13px] font-bold text-green-50/80 underline underline-offset-2">
              اضغط في أي مكان للمتابعة
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function introPillars(slide: Slide) {
  if (slide.id === 'program-welcome') {
    return [
      { label: 'الحوكمة', detail: 'توجيه القرار' },
      { label: 'الامتثال', detail: 'إثبات التطبيق' },
      { label: 'المخاطر', detail: 'حماية الأولويات' },
    ];
  }

  const introText = slide.ppt?.intro ?? '';
  const afterColon = introText.includes(':') ? introText.slice(introText.indexOf(':') + 1) : introText;
  const parts = afterColon.split(/\s*-\s*/).map((part) => part.trim()).filter(Boolean);
  return (parts.length ? parts : [slide.title, slide.ppt?.subtitle ?? 'مسار تدريبي', slide.ppt?.unitTitle ?? slide.title])
    .slice(0, 3)
    .map((label, index) => ({
      label,
      detail: ['مدخل بصري', 'تطبيق عملي', 'قرار أوضح'][index],
    }));
}

function roadmapPillars(slide: Slide) {
  const cards = slide.ppt?.cards ?? [];
  return cards.slice(0, 3).map((card, index) => ({
    label: card.title,
    detail: card.text ?? ['تأسيس القرار', 'تحقق وقياس', 'قرار واع بالمخاطر'][index],
    bullets: card.bullets ?? [],
  }));
}

function IntroMotionScene({
  slide,
  spoken,
  started,
  onStart,
}: {
  slide: Slide;
  spoken: number;
  started: boolean;
  onStart: () => void;
}) {
  const pillars = introPillars(slide);
  const effectiveSpoken = spoken;
  const progress = Math.max(0, Math.min(1, effectiveSpoken / Math.max(1, slide.narration.length)));
  const instantVisualProgress = started ? progress : 0;
  const [peakVisualProgress, setPeakVisualProgress] = useState(0);

  useEffect(() => {
    setPeakVisualProgress((previous) => (started ? Math.max(previous, instantVisualProgress) : 0));
  }, [instantVisualProgress, started]);

  useEffect(() => setPeakVisualProgress(0), [slide.id]);

  const visualProgress = started ? Math.max(instantVisualProgress, peakVisualProgress) : 0;
  const narrationComplete = started && progress >= 0.985;
  const spokenPast = (needle: string, fallback: number) => {
    const index = slide.narration.indexOf(needle);
    return started && (visualProgress >= fallback || (index >= 0 && effectiveSpoken >= index));
  };
  const firstPillarShown = spokenPast('بنمشي سوا من بناء الحوكمة', 0.52);
  const secondPillarShown = spokenPast('إلى الامتثال واختبار الضوابط', 0.62);
  const thirdPillarShown = spokenPast('ثم نختم بإدارة المخاطر', 0.72);
  const activeIndex = thirdPillarShown ? 2 : secondPillarShown ? 1 : 0;
  const visiblePillars = started
    ? thirdPillarShown
      ? 3
      : secondPillarShown
        ? 2
        : firstPillarShown
          ? 1
          : 0
    : 0;
  const layerState = [
    {
      src: '/motion-assets/intro-governance-layer.png',
      className: 'right-[8%] top-[18%] w-[28%]',
      visible: firstPillarShown,
      transform: `translate3d(${(1 - visualProgress) * 10}px, ${Math.sin(visualProgress * Math.PI * 2) * 2}px, 0) scale(${0.98 + visualProgress * 0.025})`,
    },
    {
      src: '/motion-assets/intro-compliance-layer.png',
      className: 'right-[31%] top-[45%] w-[17%]',
      visible: secondPillarShown,
      transform: `translate3d(${(0.46 - visualProgress) * 12}px, ${Math.cos(visualProgress * Math.PI * 2) * 2}px, 0) scale(${0.97 + visualProgress * 0.025})`,
    },
    {
      src: '/motion-assets/intro-risk-layer.png',
      className: 'right-[-5%] top-[45%] w-[17%]',
      visible: thirdPillarShown,
      transform: `translate3d(${(0.74 - visualProgress) * 12}px, ${Math.sin(visualProgress * Math.PI * 2 + 1) * 2}px, 0) scale(${0.97 + visualProgress * 0.025})`,
    },
  ];

  return (
    <div className="relative h-full min-h-0 overflow-visible">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[3%] top-[6%] h-[76%] w-[43%] rounded-[45%] bg-white/20 blur-xl" />
        <div className="absolute right-[12%] top-[16%] h-[46%] w-[27%] animate-pulse-soft rounded-full border border-dashed border-green-700/14" />
        <svg className={`absolute right-[6%] top-[20%] h-[36%] w-[36%] overflow-visible opacity-55 transition-opacity duration-700 ${started ? 'opacity-55' : 'opacity-0'}`} viewBox="0 0 420 260" aria-hidden="true">
          <path
            d="M370 40 C280 20 236 74 204 128 C162 198 96 210 34 174"
            fill="none"
            stroke="rgb(47 132 87 / 0.38)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="10 12"
          />
          <path
            d="M360 180 C270 132 220 150 172 188 C126 224 80 220 42 202"
            fill="none"
            stroke="rgb(191 155 74 / 0.42)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="7 12"
          />
        </svg>
        {layerState.map((layer, index) => (
          <img
            key={layer.src}
            src={layer.src}
            alt=""
            draggable={false}
            className={`absolute ${layer.className} drop-shadow-[0_18px_24px_rgb(24_82_55_/_0.16)] transition-all duration-1000 ease-out ${
              layer.visible ? 'translate-y-0 scale-100 opacity-100 blur-0' : 'translate-y-5 scale-95 opacity-0 blur-0'
            } ${!narrationComplete && index === activeIndex ? 'motion-layer-focus' : ''}`}
            style={{ transform: layer.visible ? layer.transform : undefined }}
          />
        ))}
        <div
          className="absolute flex items-end justify-center gap-2 transition-all duration-1000 ease-out"
          style={{ right: '5%', bottom: '10%', width: '32%' }}
        >
        {/* Narration reveals pillars in content order (governance → compliance →
            risk), but the client wants them displayed governance-middle,
            compliance-left, risk-right — reorder visually with `order`
            instead of reordering the array, so the reveal/active timing
            (tied to `index`) still lines up with what the narration says. */}
        {pillars.map((pillar, index) => {
          const shown = index < visiblePillars;
          const active = !narrationComplete && index === activeIndex;
          const cardWidth = 'w-[112px]';
          const visualOrder = [1, 2, 0][index] ?? index;
          return (
            <div
              key={`intro-label-${pillar.label}`}
              className={`${cardWidth} shrink-0 rounded-2xl border px-2.5 py-3 text-center shadow-sm backdrop-blur-md transition-all duration-[900ms] ease-out ${
                shown ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-5 scale-95 opacity-0'
              } ${
                active
                  ? 'z-10 -translate-y-1 scale-[1.04] border-gold-500/55 bg-green-800/94 text-white shadow-card-lg'
                  : 'border-green-700/20 bg-white/90 text-green-900'
              }`}
              style={{
                order: visualOrder,
                transitionDelay: shown ? `${index * 80}ms` : '0ms',
                ...(active ? { backgroundColor: 'rgb(26 68 46 / 0.94)', borderColor: 'rgb(191 155 74 / 0.55)' } : {}),
              }}
            >
              <span className="mx-auto mb-1.5 grid h-9 w-9 place-items-center rounded-xl bg-white/88 p-1 shadow-sm">
                <CourseGlyph kind={courseGlyphKind(`${pillar.label} ${pillar.detail}`)} compact />
              </span>
              <p className="text-[14px] font-black leading-tight">{pillar.label}</p>
              <p className={`mt-1 text-[11px] font-extrabold leading-snug ${active ? 'text-green-50' : 'text-ink'}`}>{pillar.detail}</p>
            </div>
          );
        })}
        </div>
      </div>

      <div className="relative z-10 flex h-full min-h-0 flex-col justify-between px-6 py-5 text-right">
        <div className="mr-auto w-[49%] animate-fade-up">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-green-700/18 bg-white/78 px-4 py-1.5 text-[14px] font-extrabold text-green-800 shadow-sm backdrop-blur-sm">
              تحت إشراف أ/ ناصر
            </span>
            <span className="rounded-full border border-gold-500/25 bg-gold-50/78 px-4 py-1.5 text-[14px] font-extrabold text-gold-700 shadow-sm backdrop-blur-sm">
              بداية الرحلة
            </span>
          </div>

          <p className="mb-2 text-[20px] font-extrabold text-green-800">{slide.ppt?.courseName}</p>
          {slide.ppt?.subtitle && (
            <p className="mb-2 w-fit rounded-lg bg-green-700 px-4 py-1.5 text-[18px] font-extrabold text-white shadow-card">
              {slide.ppt.subtitle}
            </p>
          )}
          <h2 className="text-[36px] font-black leading-[1.12] text-brand-strong drop-shadow-[0_2px_0_rgb(255_255_255_/_0.8)]">
            {slide.ppt?.unitTitle ?? slide.title}
          </h2>
          <p className="mt-3 max-w-[520px] text-[18px] font-bold leading-relaxed text-ink-soft">
            {slide.ppt?.intro}
          </p>
        </div>

        <div className="absolute bottom-[130px] left-6 flex items-center justify-end">
          <button
            type="button"
            onClick={onStart}
            className="btn-gold shrink-0 px-8 py-3.5 text-[18px] shadow-card"
          >
            <Icon name="flag" className="h-6 w-6" />
            {started ? 'استمع للمقدمة' : 'خلونا نبدأ'}
          </button>
        </div>
      </div>
    </div>
  );
}

function IntroRoadmapMotionScene({
  slide,
  spoken,
  started,
}: {
  slide: Slide;
  spoken: number;
  started: boolean;
}) {
  const pillars = roadmapPillars(slide);
  const effectiveSpoken = spoken;
  const progress = Math.max(0, Math.min(1, effectiveSpoken / Math.max(1, slide.narration.length)));
  const instantVisualProgress = started ? progress : 0;
  const [peakVisualProgress, setPeakVisualProgress] = useState(0);

  useEffect(() => {
    setPeakVisualProgress((previous) => (started ? Math.max(previous, instantVisualProgress) : 0));
  }, [instantVisualProgress, started]);

  useEffect(() => setPeakVisualProgress(0), [slide.id]);

  const visualProgress = started ? Math.max(instantVisualProgress, peakVisualProgress) : 0;
  const narrationComplete = started && progress >= 0.985;
  const spokenPast = (needle: string, fallback: number) => {
    const index = slide.narration.indexOf(needle);
    return started && (visualProgress >= fallback || (index >= 0 && effectiveSpoken >= index));
  };
  const firstStepShown = spokenPast('أول فكرة معنا', 0.18);
  const secondStepShown = spokenPast('بعد ما تتضح البداية', 0.42);
  const thirdStepShown = spokenPast('ثم نصل إلى الفصل الثالث', 0.64);
  const current = thirdStepShown ? 2 : secondStepShown ? 1 : 0;
  const visibleStepCount = started
    ? thirdStepShown
      ? 3
      : secondStepShown
        ? 2
        : firstStepShown
          ? 1
          : 0
    : 0;
  const roadmapArrows = [
    { d: 'M720 238 C636 188 570 154 490 154', color: 'rgb(31 105 72)', delay: '0ms' },
    { d: 'M720 262 C636 262 568 262 490 262', color: 'rgb(191 155 74)', delay: '90ms' },
    { d: 'M720 286 C636 340 570 370 490 370', color: 'rgb(23 150 132)', delay: '180ms' },
  ];
  const layers = [
    {
      src: '/motion-assets/intro-governance-layer.png',
      className: '',
      visible: true,
      transform: `translate3d(${Math.sin(visualProgress * 6) * 3}px, ${Math.cos(visualProgress * 5) * 2}px, 0) scale(${0.98 + visualProgress * 0.02})`,
    },
    {
      src: '/motion-assets/intro-compliance-layer.png',
      className: '',
      visible: true,
      transform: `translate3d(${Math.sin(visualProgress * 7 + 1) * 3}px, ${Math.cos(visualProgress * 6) * 2}px, 0) scale(${0.98 + visualProgress * 0.02})`,
    },
    {
      src: '/motion-assets/intro-risk-layer.png',
      className: '',
      visible: true,
      transform: `translate3d(${Math.sin(visualProgress * 8 + 2) * 3}px, ${Math.cos(visualProgress * 5 + 2) * 2}px, 0) scale(${0.98 + visualProgress * 0.02})`,
    },
  ];
  const orderedPillars = pillars;

  return (
    <div className="relative h-full min-h-0 overflow-visible">
      <div className="pointer-events-none absolute inset-0">
        <svg className="absolute inset-0 z-0 h-full w-full overflow-visible" viewBox="0 0 1000 560" aria-hidden="true">
          <defs>
            {roadmapArrows.map((arrow, index) => (
              <marker
                key={`arrow-marker-${index}`}
                id={`roadmap-arrow-${index}`}
                markerWidth="14"
                markerHeight="14"
                refX="10"
                refY="7"
                orient="auto"
              >
                <path d="M2 2 L12 7 L2 12 Z" fill={arrow.color} opacity="0.88" />
              </marker>
            ))}
          </defs>
          {roadmapArrows.map((arrow, index) => {
            const visible = index < visibleStepCount;
            const activeArrow = !narrationComplete && index === current;
            return (
              <path
                key={arrow.d}
                d={arrow.d}
                fill="none"
                stroke={arrow.color}
                strokeWidth={activeArrow ? 7 : 5}
                strokeLinecap="round"
                markerEnd={`url(#roadmap-arrow-${index})`}
                className={`transition-all duration-700 ease-out ${
                  visible ? 'opacity-80' : 'opacity-0'
                }`}
                style={{
                  strokeDasharray: 260,
                  strokeDashoffset: visible ? 0 : 260,
                  transitionDelay: arrow.delay,
                  filter: activeArrow ? 'drop-shadow(0 10px 10px rgb(24 82 55 / 0.18))' : undefined,
                }}
              />
            );
          })}
        </svg>
      </div>

      <div className="relative z-10 flex h-full min-h-0 flex-col px-5 py-5">
        <div className="absolute right-[-1.5%] z-10 flex w-[34%] items-center justify-center gap-3 text-center" style={{ top: 168 }}>
          <span className="grid h-[208px] w-[208px] shrink-0 place-items-center p-0 animate-float">
            <CourseGlyph kind="target" />
          </span>
          <h2 className="max-w-[300px] text-center text-[38px] font-black leading-tight text-brand-strong drop-shadow-[0_2px_0_rgb(255_255_255_/_0.9)]">
            محتويات الحقيبة الأولى
          </h2>
        </div>

        <div className="absolute flex flex-col gap-5" style={{ left: '5%', top: 112, width: '44%' }}>
          {orderedPillars.map((pillar, index) => {
            const shown = index < visibleStepCount;
            const active = !narrationComplete && index === current;
            const layer = layers[index];
            return (
              <div
                key={pillar.label}
                className={`relative flex items-center gap-4 overflow-hidden rounded-[18px] border px-3 py-2 text-right shadow-[0_16px_30px_rgb(24_82_55_/_0.10)] backdrop-blur-md transition-all duration-700 ${
                  shown ? 'translate-x-0 scale-100 opacity-100' : 'pointer-events-none -translate-x-10 scale-95 opacity-0'
                } ${
                  active
                    ? 'z-20 translate-x-2 scale-[1.02] border-gold-500/55 bg-gradient-to-br from-green-800 via-green-700 to-teal-700 text-white shadow-card-lg'
                    : 'border-green-700/14 bg-white/88 text-brand-strong'
                }`}
                style={{ minHeight: 84 }}
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 ${active ? 'bg-gold-500' : 'bg-green-700/35'}`} />
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border text-[24px] font-black tabular ${
                    active ? 'border-white/30 bg-white/16 text-white' : 'border-green-700/16 bg-white/88 text-green-800'
                  }`}>
                  {toArabicDigits(index + 1)}
                </span>
                <img
                  src={layer.src}
                  alt=""
                  draggable={false}
                  className={`shrink-0 object-contain transition-all duration-700 ${
                    active ? 'motion-layer-focus' : 'drop-shadow-[0_14px_20px_rgb(24_82_55_/_0.12)]'
                  }`}
                  style={{ height: 66, width: 84, transform: shown ? layer.transform : undefined }}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[20px] font-black leading-snug">{pillar.detail}</h3>
                  <p className={`mt-1 text-[13px] font-bold leading-snug ${active ? 'text-green-50' : 'text-ink-soft'}`}>
                    {pillar.bullets[0] ?? pillar.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute bottom-5 right-6 left-6 h-px bg-gradient-to-l from-transparent via-green-700/16 to-transparent" />
      </div>
    </div>
  );
}

type CourseGlyphKind =
  | 'governance'
  | 'compliance'
  | 'risk'
  | 'ethics'
  | 'policy'
  | 'audit'
  | 'training'
  | 'decision'
  | 'question'
  | 'target'
  | 'default';

function courseGlyphKind(text: string): CourseGlyphKind {
  if (/مخاطر|خطر|Risk|KRI|الأثر|الاحتمالية/.test(text)) return 'risk';
  if (/امتثال|ضوابط|تدقيق|اختبار|PDCA|تحقق/.test(text)) return 'compliance';
  if (/حوكمة|مجلس|لجان|صلاحيات|إطار/.test(text)) return 'governance';
  if (/أخلاق|نزاهة|تضارب|مصالح|حياد/.test(text)) return 'ethics';
  if (/سياس|وثيق|دليل|إجراء|مدونة/.test(text)) return 'policy';
  if (/مراقبة|مراجعة|تقرير|مؤشر|قياس/.test(text)) return 'audit';
  if (/تدريب|توعية|ثقافة|سلوك/.test(text)) return 'training';
  if (/قرار|قياد|خطة|مسؤول/.test(text)) return 'decision';
  if (/سؤال|اختبار|ناقش|فكر/.test(text)) return 'question';
  return 'default';
}

function CourseGlyph({
  kind = 'default',
  active = false,
  compact = false,
}: {
  kind?: CourseGlyphKind;
  active?: boolean;
  compact?: boolean;
}) {
  const stroke = active ? 'rgb(255 255 255)' : 'rgb(31 105 72)';
  const accent = active ? 'rgb(246 211 122)' : 'rgb(191 155 74)';
  const muted = active ? 'rgb(255 255 255 / 0.42)' : 'rgb(47 132 87 / 0.22)';
  const common = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const strokeWidth = compact ? 6 : 5.2;

  const paths: Record<CourseGlyphKind, React.ReactNode> = {
    governance: (
      <>
        <path {...common} d="M22 72h60M28 72V36l24-12 24 12v36M38 72V46M52 72V42M66 72V46" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M32 82h40" stroke={accent} strokeWidth={strokeWidth} />
      </>
    ),
    compliance: (
      <>
        <path {...common} d="M30 52l14 14 30-34" stroke={accent} strokeWidth={strokeWidth + 1} />
        <path {...common} d="M22 22h60v60H22z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M34 34h18M34 78h34" stroke={muted} strokeWidth={strokeWidth - 1} />
      </>
    ),
    risk: (
      <>
        <path {...common} d="M52 18l34 62H18z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M52 38v18M52 68h.2" stroke={accent} strokeWidth={strokeWidth + 1} />
        <path {...common} d="M31 80h42" stroke={muted} strokeWidth={strokeWidth - 1} />
      </>
    ),
    ethics: (
      <>
        <path {...common} d="M52 22v58M30 36h44M32 36l-12 24h24zM72 36L60 60h24z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M38 82h28" stroke={accent} strokeWidth={strokeWidth} />
      </>
    ),
    policy: (
      <>
        <path {...common} d="M28 18h38l12 12v54H28zM66 18v14h12" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M38 44h28M38 56h28M38 68h18" stroke={accent} strokeWidth={strokeWidth - 1} />
      </>
    ),
    audit: (
      <>
        <circle cx="44" cy="44" r="22" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M60 60l20 20M35 44l7 7 14-17" stroke={accent} strokeWidth={strokeWidth} />
      </>
    ),
    training: (
      <>
        <path {...common} d="M20 38l32-16 32 16-32 16zM32 48v18c8 8 32 8 40 0V48" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M84 38v22" stroke={accent} strokeWidth={strokeWidth} />
      </>
    ),
    decision: (
      <>
        <path {...common} d="M22 28h36l16 16-16 16H22zM42 60v22" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M60 72h22" stroke={accent} strokeWidth={strokeWidth} />
      </>
    ),
    question: (
      <>
        <path {...common} d="M36 38c1-12 30-18 32 2 2 17-16 16-16 30" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M52 82h.2" stroke={accent} strokeWidth={strokeWidth + 2} />
        <circle cx="52" cy="52" r="36" fill="none" stroke={muted} strokeWidth={strokeWidth - 1} />
      </>
    ),
    target: (
      <>
        <circle cx="48" cy="56" r="30" fill="none" stroke={muted} strokeWidth={strokeWidth - 1} />
        <circle cx="48" cy="56" r="19" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        <circle cx="48" cy="56" r="7" fill="none" stroke={accent} strokeWidth={strokeWidth} />
        <path {...common} d="M60 44l23-23M72 21h11v11" stroke={accent} strokeWidth={strokeWidth} />
        <path {...common} d="M62 42l-14 14" stroke={stroke} strokeWidth={strokeWidth + 0.5} />
      </>
    ),
    default: (
      <>
        <path {...common} d="M52 18l28 16v32L52 82 24 66V34z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M36 52h32M52 36v32" stroke={accent} strokeWidth={strokeWidth} />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 104 104" className="h-full w-full" aria-hidden="true">
      <circle cx="52" cy="52" r="47" fill={active ? 'rgb(255 255 255 / 0.08)' : 'rgb(255 255 255 / 0.62)'} />
      <circle cx="52" cy="52" r="43" fill="none" stroke={muted} strokeWidth="3" strokeDasharray="8 10" />
      {paths[kind]}
    </svg>
  );
}

function PptTitle({ slide }: { slide: Slide }) {
  const displayTitle = slide.ppt?.unitTitle ?? slide.title;
  const glyphKind = courseGlyphKind(`${displayTitle} ${slide.ppt?.subtitle ?? ''} ${slide.ppt?.courseName ?? ''}`);
  return (
    <div className="mb-4 text-center">
      {slide.ppt?.eyebrow && (
        <p className="mb-1 text-[17px] font-extrabold text-gold-600">{slide.ppt.eyebrow}</p>
      )}
      {slide.ppt?.courseName && (
        <p className="mb-2 text-[22px] font-extrabold leading-relaxed text-ink">
          {slide.ppt.courseName}
        </p>
      )}
      {slide.ppt?.subtitle && slide.ppt?.courseName && (
        <p className="mx-auto mb-2 w-fit rounded-full border border-green-700/20 bg-green-50 px-5 py-1 text-[18px] font-extrabold text-green-800">
          {slide.ppt.subtitle}
        </p>
      )}
      <h2 className="inline-flex items-center justify-center gap-3 text-[36px] font-extrabold leading-tight text-brand-strong">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-green-700/16 bg-white/80 p-1.5 shadow-sm">
          <CourseGlyph kind={glyphKind} compact />
        </span>
        <span>{displayTitle}</span>
      </h2>
      {slide.ppt?.subtitle && !slide.ppt?.courseName && (
        <p className="mt-1 text-[20px] font-bold leading-relaxed text-ink-soft">{slide.ppt.subtitle}</p>
      )}
    </div>
  );
}

function PptCardView({
  card,
  dense = false,
  density,
  emoji,
  active = false,
  visible = true,
  revealAnimation = 'animate-fade-up',
  detail,
  reveal,
  onClick,
}: {
  card: PptCard;
  dense?: boolean;
  density?: 'loose' | 'normal' | 'compact' | 'micro';
  emoji?: string;
  active?: boolean;
  visible?: boolean;
  revealAnimation?: string;
  detail?: string;
  reveal?: boolean;
  onClick?: () => void;
}) {
  void emoji;
  const tone = card.tone ?? 'green';
  const clickable = Boolean(onClick);
  const textSize = (card.title.length + (card.text?.length ?? 0) + (card.bullets?.join(' ').length ?? 0));
  const bulletCount = card.bullets?.length ?? 0;
  const level = density ?? (
    textSize > 155 || bulletCount >= 7 || (dense && textSize > 125)
      ? 'micro'
      : textSize > 110 || bulletCount >= 5
        ? 'compact'
        : dense
          ? textSize < 82 ? 'normal' : 'compact'
          : textSize < 76 && bulletCount <= 3
            ? 'loose'
            : 'normal'
  );
  const padClass = level === 'micro' ? 'p-2.5' : level === 'compact' ? 'p-3.5' : level === 'loose' ? 'p-5' : 'p-4';
  const titleClass =
    level === 'micro'
      ? 'text-[17px] leading-[1.28]'
      : level === 'compact'
        ? 'text-[18.5px] leading-snug'
        : level === 'loose'
          ? 'text-[23px] leading-tight'
          : 'text-[21px] leading-tight';
  const bodyClass =
    level === 'micro'
      ? 'text-[14.5px] leading-[1.28]'
      : level === 'compact'
        ? 'text-[16px] leading-snug'
        : level === 'loose'
          ? 'text-[20px] leading-relaxed'
        : 'text-[18px] leading-relaxed';
  const bulletClass = level === 'micro' ? 'text-[14px] leading-[1.28]' : level === 'compact' ? 'text-[15.5px] leading-snug' : 'text-[17px] leading-snug';
  const indexSize = level === 'micro' ? 'h-7 w-7 text-[12px]' : 'h-8 w-8 text-[14px]';
  const iconSize =
    level === 'micro'
      ? 'h-9 w-9 p-1'
      : level === 'compact'
        ? 'h-10 w-10 p-1.5'
        : level === 'loose'
          ? 'h-14 w-14 p-2'
          : 'h-12 w-12 p-1.5';
  const glyphKind = courseGlyphKind(`${card.title} ${card.text ?? ''} ${card.bullets?.join(' ') ?? ''} ${card.answer ?? ''}`);
  const passiveShell =
    tone === 'gold'
      ? 'border-gold-500/30 bg-gradient-to-br from-white/95 via-gold-50/80 to-white'
      : tone === 'blue'
        ? 'border-sky-500/24 bg-gradient-to-br from-white/95 via-sky-50/75 to-white'
        : tone === 'gray'
          ? 'border-slate-300/70 bg-white/92'
          : 'border-green-700/18 bg-gradient-to-br from-white/96 via-green-50/65 to-white';
  const activeShell = active
    ? 'scale-[1.018] border-gold-500/55 bg-gradient-to-br from-green-800 via-green-700 to-teal-700 text-white shadow-card-lg'
    : passiveShell;
  const titleTone = active ? 'text-white' : 'text-brand-strong';
  const bodyTone = active ? 'text-green-50' : 'text-ink';
  const tileTone = active
    ? 'border-white/30 bg-white/16 text-white shadow-card'
    : tone === 'gold'
      ? 'border-gold-500/28 bg-white/85'
      : tone === 'blue'
        ? 'border-sky-500/24 bg-white/85'
        : 'border-green-700/16 bg-white/85';
  const topBar = active ? 'bg-gold-400' : tone === 'gold' ? 'bg-gold-500' : 'bg-green-700';
  const showAnswerDetail = reveal && Boolean(card.answer);
  const showTrainingDetail = reveal && Boolean(detail) && !card.answer;
  return (
    <button
      type="button"
      disabled={!clickable || !visible}
      onClick={onClick}
      data-ppt-card="true"
      aria-hidden={!visible}
      aria-label={clickable ? `${card.title} - ${showTrainingDetail ? 'العودة للنص الأساسي' : 'عرض التفصيل'}` : card.title}
      className={`relative flex h-fit w-full max-h-full min-h-0 flex-col self-center overflow-hidden rounded-[18px] border text-right shadow-[0_14px_34px_rgb(24_82_55_/_0.10)] backdrop-blur-sm transition-all duration-300 ${
        activeShell
      } ${visible ? revealAnimation : 'pointer-events-none opacity-0'} ${clickable && visible ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card' : 'cursor-default'}`}
    >
      {active && <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255_/_0.22),transparent_36%)]" />}
      <span className={`relative h-1.5 w-full shrink-0 ${topBar}`} />
      <div className={`${padClass} flex min-h-0 flex-col`}>
        <div className={`${level === 'micro' ? 'mb-1.5' : 'mb-2'} flex items-start gap-2`}>
          <span className={`grid ${iconSize} shrink-0 place-items-center rounded-2xl border ${tileTone}`}>
            <CourseGlyph kind={glyphKind} active={active} compact={level === 'micro' || level === 'compact'} />
          </span>
          {card.index && (
            <span className={`grid ${indexSize} shrink-0 place-items-center rounded-full font-extrabold tabular ${active ? 'bg-white/20 text-white ring-2 ring-white/25' : 'bg-green-700 text-white'}`}>
              {card.index}
            </span>
          )}
          <h3 className={`${showAnswerDetail ? 'text-[18px] leading-tight' : titleClass} font-extrabold ${titleTone}`}>
            {showAnswerDetail ? `الإجابة: ${card.answer}` : card.title}
          </h3>
        </div>

        {showAnswerDetail ? (
          <div className={`mt-1 rounded-md border p-2.5 ${active ? 'border-white/25 bg-white/15' : 'border-green-700/25 bg-green-700/8'}`}>
            <p className={`${level === 'micro' ? 'text-[14.5px]' : 'text-[16px]'} font-bold leading-relaxed ${bodyTone}`}>
              {card.rationale ?? 'اربط الإجابة بالهدف التدريبي ثم انتقل للنقطة التالية.'}
            </p>
          </div>
        ) : showTrainingDetail ? (
          <div className={`mt-1 rounded-md border p-2.5 ${active ? 'border-white/25 bg-white/15' : 'border-green-700/25 bg-green-700/8'}`}>
            <p className={`${level === 'micro' ? 'text-[14.5px]' : 'text-[16px]'} font-bold leading-relaxed ${bodyTone}`}>
              {detail}
            </p>
          </div>
        ) : card.text && (
          <p className={`${bodyClass} whitespace-pre-line font-bold ${bodyTone}`}>
            {card.text}
          </p>
        )}

        {!showTrainingDetail && !showAnswerDetail && card.bullets && (
          <ul className={`${level === 'micro' ? 'mt-1 space-y-1' : 'mt-1.5 space-y-1.5'}`}>
            {card.bullets.map((bullet, i) => (
              <li key={i} className={`${bulletClass} flex gap-2 font-bold ${bodyTone}`}>
                <span className={`${level === 'micro' ? 'mt-1 h-1.5 w-1.5' : 'mt-1.5 h-2 w-2'} shrink-0 rounded-sm ${active ? 'bg-gold-300' : 'bg-gold-500'}`} />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {clickable && (
          <span className={`mt-auto inline-grid h-6 w-6 place-items-center self-end rounded-full text-[15px] font-extrabold ${active ? 'bg-white/20 text-white' : 'bg-green-700/10 text-green-800'}`}>
            {showTrainingDetail || showAnswerDetail ? '↩' : '+'}
          </span>
        )}

      </div>
    </button>
  );
}

function PptActivitySlide({
  slide,
  spoken,
  muted,
  showDialogue,
  onActivityDone,
}: {
  slide: Slide;
  spoken: number;
  muted: boolean;
  showDialogue: boolean;
  onActivityDone: (id: string) => void;
}) {
  const cards = slide.ppt?.cards ?? [];
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [phase, setPhase] = useState<'intro' | 'awaiting-answer' | 'feedback' | 'awaiting-next' | 'asking-next'>('intro');
  const guidedSpeech = useGuidedSpeech(slide, muted);
  const currentCard = cards[currentStep];
  const selectedAnswer = answers[currentStep];
  const activityReady = spoken >= slide.narration.length - 1;
  const questionText = useCallback(
    (card: PptCard, index: number) => governanceQuestionText(card, index, cards.length),
    [cards.length],
  );

  useEffect(() => {
    if (activityReady && phase === 'intro') setPhase('awaiting-answer');
  }, [activityReady, phase]);

  const interactionLine =
    guidedSpeech.line ?? (activityReady && currentCard && phase === 'awaiting-answer' ? questionText(currentCard, currentStep) : undefined);
  const currentCardVisible = currentStep === 0
    ? spoken >= slide.narration.length * 0.5
    : phase !== 'asking-next' || guidedSpeech.started;
  const answerVisible = Boolean(selectedAnswer) && (phase === 'awaiting-next' || (phase === 'feedback' && guidedSpeech.started));

  const answerQuestion = (answer: string) => {
    if (!activityReady || phase !== 'awaiting-answer' || selectedAnswer) return;
    setAnswers((current) => ({ ...current, [currentStep]: answer }));
    setPhase('feedback');
    if (!currentCard) return;
    const correctness = answer === currentCard.answer ? 'correct' : 'incorrect';
    const feedback = governanceFeedbackText(currentCard, answer);
    const key = `${slide.audioKey}-feedback-${currentStep + 1}-${correctness}`;
    guidedSpeech.speak(key, feedback, () => setPhase('awaiting-next'));
  };

  const nextQuestion = () => {
    if (!selectedAnswer || phase !== 'awaiting-next') return;
    if (currentStep >= cards.length - 1) {
      onActivityDone(slide.id);
      return;
    }
    const nextStep = currentStep + 1;
    const nextCard = cards[nextStep];
    setCurrentStep(nextStep);
    setPhase('asking-next');
    const key = `${slide.audioKey}-question-${nextStep + 1}`;
    guidedSpeech.speak(key, questionText(nextCard, nextStep), () => setPhase('awaiting-answer'));
  };

  return (
    <StorySlideShell slide={slide} spoken={spoken} showDialogue={showDialogue || Boolean(interactionLine)} dialogueOverride={interactionLine}>
      <div className="flex h-full min-h-0 flex-col px-8 py-3">
        <PptTitle slide={slide} />
        <div className="mb-3 rounded-lg border-r-8 border-gold-500 bg-white/95 p-3.5 text-right shadow-sm">
          <p className="text-[20px] font-extrabold leading-relaxed text-brand-strong">{slide.ppt?.intro}</p>
          <p className="mt-1 text-[18px] font-bold leading-relaxed text-ink-soft">{slide.ppt?.prompt}</p>
        </div>
        <div className="grid min-h-0 flex-1 items-center grid-cols-[1fr_220px] gap-3">
          {currentCard && (
            <PptCardView
              key={currentStep}
              card={currentCard}
              density="normal"
              emoji={pptEmojiFor(currentCard, slide.visual, currentStep)}
              active={answerVisible}
              visible={currentCardVisible}
              reveal={answerVisible}
              revealAnimation={PPT_REVEAL_ANIMS[currentStep % PPT_REVEAL_ANIMS.length]}
            />
          )}
          <div className={`flex min-h-0 flex-col justify-center gap-2 rounded-lg border-2 border-green-700/20 bg-white/92 p-3 transition-all ${activityReady ? 'animate-slide-in opacity-100' : 'pointer-events-none opacity-0'}`}>
            <button
              type="button"
              disabled={phase !== 'awaiting-answer'}
              onClick={() => answerQuestion('حوكمة')}
              className={`rounded-lg border-2 px-4 py-3 text-[19px] font-extrabold transition-all ${selectedAnswer === 'حوكمة' ? 'border-green-700 bg-green-700 text-white' : 'border-green-700/25 bg-green-700/8 text-green-800 hover:bg-green-700/15'}`}
            >
              حوكمة
            </button>
            <button
              type="button"
              disabled={phase !== 'awaiting-answer'}
              onClick={() => answerQuestion('امتثال')}
              className={`rounded-lg border-2 px-4 py-3 text-[19px] font-extrabold transition-all ${selectedAnswer === 'امتثال' ? 'border-gold-600 bg-gold-500 text-white' : 'border-gold-500/35 bg-gold-500/10 text-gold-700 hover:bg-gold-500/18'}`}
            >
              امتثال
            </button>
            {selectedAnswer && phase === 'awaiting-next' && (
              <button type="button" onClick={nextQuestion} className="btn-gold mt-1 justify-center px-4 py-2.5 text-[17px]">
                {currentStep >= cards.length - 1 ? 'إكمال النشاط' : 'السؤال التالي'}
              </button>
            )}
          </div>
        </div>
      </div>
    </StorySlideShell>
  );
}

function PptGuidedScenarioSlide({
  slide,
  spoken,
  muted,
  showDialogue,
  onActivityDone,
}: {
  slide: Slide;
  spoken: number;
  muted: boolean;
  showDialogue: boolean;
  onActivityDone: (id: string) => void;
}) {
  const cards = slide.ppt?.cards ?? [];
  const scenarioCard = cards[0];
  const questionCards = cards.slice(1);
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [complete, setComplete] = useState(false);
  const [questionReady, setQuestionReady] = useState(true);
  const [discussionReady, setDiscussionReady] = useState(false);
  const guidedSpeech = useGuidedSpeech(slide, muted);
  const currentCard = questionCards[step];
  const ready = spoken >= slide.narration.length * 0.72;
  const questions = conflictScenarioQuestions;
  const discussions = conflictScenarioDiscussions;
  const fallbackInteractionLine = ready && !complete && !revealed && questionReady
    ? questions[step]
    : undefined;
  const interactionLine = guidedSpeech.line ?? fallbackInteractionLine;
  const discussionVisible = revealed && (guidedSpeech.started || discussionReady);

  const revealDiscussion = () => {
    if (!ready || revealed || complete) return;
    setRevealed(true);
    setQuestionReady(false);
    setDiscussionReady(false);
    const discussion = discussions[step];
    guidedSpeech.speak(`${slide.audioKey}-discussion-${step + 1}`, discussion, () => setDiscussionReady(true));
  };

  const nextDiscussion = () => {
    if (!revealed || !discussionReady) return;
    if (step >= questionCards.length - 1) {
      setComplete(true);
      guidedSpeech.speak(`${slide.audioKey}-complete`, conflictScenarioCompletion, () => onActivityDone(slide.id));
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    setRevealed(false);
    setDiscussionReady(false);
    setQuestionReady(false);
    guidedSpeech.speak(`${slide.audioKey}-question-${nextStep + 1}`, questions[nextStep], () => setQuestionReady(true));
  };

  return (
    <StorySlideShell
      slide={slide}
      spoken={spoken}
      showDialogue={showDialogue || Boolean(interactionLine)}
      dialogueOverride={interactionLine}
    >
      <div className="flex h-full min-h-0 flex-col px-8 py-3">
        <PptTitle slide={slide} />
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
          {scenarioCard && (
            <PptCardView
              card={scenarioCard}
              density="normal"
              emoji={pptEmojiFor(scenarioCard, slide.visual, 0)}
              active={!ready}
              visible={spoken > 0}
              revealAnimation="animate-slide-in"
            />
          )}
          {currentCard && (
            <PptCardView
              key={step}
              card={currentCard}
              density="compact"
              emoji={pptEmojiFor(currentCard, slide.visual, step + 1)}
              active={discussionVisible}
              visible={discussionVisible}
              revealAnimation={PPT_REVEAL_ANIMS[(step + 1) % PPT_REVEAL_ANIMS.length]}
            />
          )}
        </div>
        <div className={`mt-3 flex h-12 shrink-0 items-center justify-center gap-3 transition-all ${ready ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          {!complete && !revealed && questionReady && (
            <button type="button" onClick={revealDiscussion} className="btn-gold px-7 py-2.5 text-[17px]">
              ناقش الإجابة مع ناصر
            </button>
          )}
          {!complete && revealed && discussionReady && (
            <button type="button" onClick={nextDiscussion} className="btn-gold px-7 py-2.5 text-[17px]">
              {step >= questionCards.length - 1 ? 'إنهاء المناقشة' : 'السؤال التالي'}
            </button>
          )}
        </div>
      </div>
    </StorySlideShell>
  );
}

function PptStyleSlide({
  slide,
  spoken,
  started,
  muted,
  showDialogue,
  onStart,
  onActivityDone,
  completion,
}: {
  slide: Slide;
  spoken: number;
  started: boolean;
  muted: boolean;
  showDialogue: boolean;
  onStart: () => void;
  onActivityDone: (id: string) => void;
  completion: CompletionInfo;
}) {
  const [expandedCardKey, setExpandedCardKey] = useState<string | null>(null);
  const [checkPhase, setCheckPhase] = useState<CheckPhase>('idle');
  const guidedSpeech = useGuidedSpeech(slide, muted);

  if (slide.layout === 'pptActivitySort') {
    return <PptActivitySlide slide={slide} spoken={spoken} muted={muted} showDialogue={showDialogue} onActivityDone={onActivityDone} />;
  }
  if (slide.layout === 'pptScenario') {
    return <PptGuidedScenarioSlide slide={slide} spoken={spoken} muted={muted} showDialogue={showDialogue} onActivityDone={onActivityDone} />;
  }

  const cards = slide.ppt?.cards ?? [];
  const checks = slide.ppt?.checks ?? [];
  const narrationPosition = started ? spoken : 0;
  const cueState = activeStoryCue(slide.narration, narrationPosition);
  const revealCueIndexes = pptCardCueIndexes(cards, slide.narration);
  const narrationFinished = narrationPosition >= slide.narration.length - 1;
  const activeCard =
    narrationPosition > 0 && !narrationFinished
      ? activePptCardForCue(revealCueIndexes, cueState.index)
      : -1;
  const cardIsVisible = (index: number) =>
    narrationFinished || (narrationPosition > 0 && cueState.index >= (revealCueIndexes[index] ?? 0));
  const revealedCount = cards.filter((_, i) => cardIsVisible(i)).length;
  const isIntro = slide.layout === 'pptIntro';
  const isIntroRoadmap = slide.id === 'program-map';
  const isIntroMotion = isIntro || isIntroRoadmap;
  const isConclusion = slide.layout === 'pptConclusion';
  const isThree = slide.layout === 'pptThreeColumns';
  const isTwoPanel = slide.layout === 'pptTwoPanels';
  const dense = cards.length > 4;
  const motionStarted = started || spoken > 0 || showDialogue;

  const gridClass = isThree
    ? 'grid-cols-3 grid-rows-1'
    : isTwoPanel
        ? 'grid-cols-2 grid-rows-1'
      : cards.length <= 3
        ? 'grid-cols-3 grid-rows-1'
        : 'grid-cols-3 grid-rows-2';
  const cardDensity: 'loose' | 'normal' | 'compact' | 'micro' | undefined = undefined;
  const toggleCard = (i: number) => {
    const key = `${slide.id}:${i}`;
    if (expandedCardKey === key) {
      setExpandedCardKey(null);
      return;
    }
    setExpandedCardKey(key);
    if (slide.kind === 'activity') {
      guidedSpeech.speak(
        `${slide.audioKey}-detail-${i + 1}`,
        activityCardDiscussion(cards[i]),
        () => undefined,
      );
    }
  };
  const expandedCardIndex = cards.findIndex((_, index) => expandedCardKey === `${slide.id}:${index}`);
  const expandedCard = expandedCardIndex >= 0 ? cards[expandedCardIndex] : undefined;
  const check = checks[0];

  // Nasser only brings up the quick check once he finishes explaining the
  // slide — never a silent card sitting next to him from the start.
  useEffect(() => {
    if (!check || checkPhase !== 'idle' || !narrationFinished) return;
    setCheckPhase('asking');
    const intro = CHECK_INTROS[slide.index % CHECK_INTROS.length];
    guidedSpeech.speak(`${slide.audioKey}-check-ask`, `${intro} ${check.title}`, () => setCheckPhase('ready'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check, narrationFinished, checkPhase]);

  const revealCheck = useCallback(() => {
    if (!check || checkPhase !== 'ready') return;
    setExpandedCardKey(null);
    setCheckPhase('revealed');
    const answerLine = check.rationale ? `${check.answer}. ${check.rationale}` : check.answer ?? '';
    guidedSpeech.speak(`${slide.audioKey}-check-answer`, answerLine, () => undefined);
  }, [check, checkPhase, guidedSpeech, slide.audioKey]);

  const interactionLine = guidedSpeech.line ?? (expandedCard
    ? slide.kind === 'activity'
      ? activityCardDiscussion(expandedCard)
      : `خلنا نربط هذه النقطة بالتطبيق: ${pptDetailFor(expandedCard)} فكر كيف تظهر في بيئة عملك قبل الانتقال للنقطة التالية.`
    : undefined);

  return (
    <StorySlideShell
      slide={slide}
      spoken={started ? spoken : 0}
      showDialogue={showDialogue || Boolean(interactionLine)}
      dialogueOverride={interactionLine}
      revealedCount={revealedCount}
    >
      <div className="flex h-full min-h-0 flex-col px-8 py-3">
        {!isIntroMotion && <PptTitle slide={slide} />}

        {isIntro ? (
          <IntroMotionScene slide={slide} spoken={spoken} started={motionStarted} onStart={onStart} />
        ) : isIntroRoadmap ? (
          <IntroRoadmapMotionScene slide={slide} spoken={spoken} started={motionStarted} />
        ) : isConclusion ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
            <div className={`grid w-full max-w-5xl items-center auto-rows-fr ${gridClass} gap-3`}>
              {cards.map((card, i) => (
                <PptCardView
                  key={i}
                  card={card}
                  emoji={pptEmojiFor(card, slide.visual, i)}
                  active={activeCard === i || expandedCardKey === `${slide.id}:${i}`}
                  visible={cardIsVisible(i)}
                  revealAnimation={PPT_REVEAL_ANIMS[i % PPT_REVEAL_ANIMS.length]}
                  detail={pptDetailFor(card)}
                  reveal={expandedCardKey === `${slide.id}:${i}`}
                  onClick={() => toggleCard(i)}
                />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-center gap-4">
              <button type="button" onClick={completion.onExit} className="btn-gold px-9 py-4 text-lg">
                <Icon name="flag" className="h-6 w-6" />
                إنهاء والعودة للمنصة
              </button>
              <button type="button" onClick={completion.onRestart} className="btn-ghost px-9 py-4 text-lg">
                <Icon name="flow" className="h-6 w-6" />
                إعادة الفصل
              </button>
            </div>
          </div>
        ) : (
          <div className={`grid min-h-0 flex-1 items-center auto-rows-fr ${gridClass} gap-3`}>
            {cards.map((card, i) => (
              <PptCardView
                key={i}
                card={card}
                dense={dense}
                density={cardDensity}
                emoji={pptEmojiFor(card, slide.visual, i)}
                active={activeCard === i || expandedCardKey === `${slide.id}:${i}`}
                visible={cardIsVisible(i)}
                revealAnimation={PPT_REVEAL_ANIMS[i % PPT_REVEAL_ANIMS.length]}
                detail={pptDetailFor(card)}
                reveal={expandedCardKey === `${slide.id}:${i}`}
                onClick={() => toggleCard(i)}
              />
            ))}
          </div>
        )}
      </div>
      {check && (
        <PptQuickCheckPopup
          check={check}
          phase={checkPhase}
          onReveal={revealCheck}
          onDismiss={() => setCheckPhase('done')}
        />
      )}
    </StorySlideShell>
  );
}

// ---- Stage -----------------------------------------------------------------

function ActivityChip({ label }: { label: string }) {
  return (
    <span className="chip mb-2 bg-brand/12 text-brand text-base font-bold">
      <Icon name="target" className="w-4 h-4" />
      {label}
    </span>
  );
}

function TitleHead({ slide }: { slide: Slide }) {
  return (
    <h2 className="flex items-center gap-3 text-[32px] font-extrabold leading-tight text-brand-strong animate-fade-up">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-green-500/12 to-gold-500/16 p-2 shadow-card">
        <CourseGlyph kind={courseGlyphKind(`${slide.title} ${slide.narration}`)} compact />
      </span>
      {slide.title}
    </h2>
  );
}

function QuizStorySlide({
  slide,
  spoken,
  muted,
  showDialogue,
  onQuizComplete,
}: {
  slide: Slide;
  spoken: number;
  muted: boolean;
  showDialogue: boolean;
  onQuizComplete: (score: number) => void;
}) {
  const guidedSpeech = useGuidedSpeech(slide, muted);
  const [feedbackPending, setFeedbackPending] = useState(false);

  const handleAnswer = (question: QuizQuestion, _selectedIndex: number, correct: boolean) => {
    const result = correct ? 'correct' : 'incorrect';
    setFeedbackPending(true);
    guidedSpeech.speak(
      `${slide.audioKey}-feedback-${question.id}-${result}`,
      quizFeedbackText(question, correct),
      () => setFeedbackPending(false),
    );
  };

  return (
    <StorySlideShell
      slide={slide}
      spoken={spoken}
      showDialogue={showDialogue || Boolean(guidedSpeech.line)}
      dialogueOverride={guidedSpeech.line}
    >
      <div className="flex h-full flex-col p-7">
        <TitleHead slide={slide} />
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden animate-fade-in">
          <ActivityChip label={slide.activityLabel ?? 'اختبار المعرفة'} />
          <div className="min-h-0 flex-1">
            <KnowledgeCheck
              quiz={slide.quiz!}
              onComplete={onQuizComplete}
              onAnswer={handleAnswer}
              onAdvance={guidedSpeech.clear}
              feedbackPending={feedbackPending}
            />
          </div>
        </div>
      </div>
    </StorySlideShell>
  );
}

export function SlideStage({
  slide,
  spoken,
  started,
  muted,
  showDialogue,
  onStart,
  onActivityDone,
  onQuizComplete,
  completion,
}: {
  slide: Slide;
  spoken: number;
  started: boolean;
  muted: boolean;
  showDialogue: boolean;
  onStart: () => void;
  onActivityDone: (id: string) => void;
  onQuizComplete: (score: number) => void;
  completion: CompletionInfo;
}) {
  if (slide.layout?.startsWith('ppt')) {
    return (
      <PptStyleSlide
        slide={slide}
        spoken={spoken}
        started={started}
        muted={muted}
        showDialogue={showDialogue}
        onStart={onStart}
        onActivityDone={onActivityDone}
        completion={completion}
      />
    );
  }

  // Welcome
  if (slide.kind === 'welcome') {
    const highlights =
      slide.content?.highlights && slide.content.highlights.kind === 'points'
        ? slide.content.highlights.items
        : [];
    return (
      <StorySlideShell slide={slide} spoken={started ? spoken : 0} showDialogue={showDialogue}>
        <div className="flex h-full items-center gap-10 p-14">
        <div className="flex-1 animate-fade-up">
          <span className="chip mb-3 bg-gold-500/15 text-gold-600 text-sm font-bold">
            <Icon name="sparkles" className="w-4 h-4" />
            الفصل الأول · دورة تدريبية مصوّرة
          </span>
          <h1 className="text-[42px] font-extrabold leading-tight text-brand-strong">{slide.title}</h1>
          <p className="mt-3 text-xl font-bold text-brand-soft">
            رحلة تعلّم في الحوكمة والامتثال وأخلاقيات العمل في القطاع الصحي
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {highlights.map((h, i) => (
              <span key={i} className="chip bg-surface text-ink-soft text-sm shadow-card">
                <span className="text-lg">{h.emoji}</span>
                {h.title}
              </span>
            ))}
          </div>
          <button type="button" onClick={onStart} className="btn-gold mt-8 px-9 py-4 text-lg">
            <Icon name="flag" className="w-6 h-6" />
            {started ? 'استمع للمقدمة' : 'ابدأ الدورة'}
          </button>
          <p className="mt-3 text-sm text-ink-muted">ثم اضغط «التالي» للانتقال بين الشرائح.</p>
        </div>
        <div className="hidden">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-green-400/18 blur-3xl" />
          <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-gold-400/18 blur-3xl" />
          <div className="hidden">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-green-400/18 blur-3xl" />
            <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-gold-400/18 blur-3xl" />
            🎓
          </div>
        </div>
        </div>
      </StorySlideShell>
    );
  }

  // Content (beats)
  if (slide.kind === 'content' && slide.beats) {
    return <BeatSlide slide={slide} spoken={spoken} showDialogue={showDialogue} />;
  }

  // Activity
  if (slide.kind === 'activity' && slide.activity) {
    const a = slide.activity;
    return (
      <StorySlideShell slide={slide} spoken={spoken} showDialogue={showDialogue}>
        <div className="flex h-full flex-col p-6">
        <TitleHead slide={slide} />
        <div className="min-h-0 flex-1 overflow-hidden animate-fade-in">
          <ActivityChip label={slide.activityLabel ?? 'نشاط تدريبي'} />
          <div className="h-[calc(100%-2.5rem)] overflow-hidden">
            {a.kind === 'classification' && (
              <ClassificationActivity data={a} onDone={() => onActivityDone(slide.id)} />
            )}
            {a.kind === 'flipCards' && (
              <FlipCardActivity data={a} onDone={() => onActivityDone(slide.id)} />
            )}
            {a.kind === 'scenarioDecision' && (
              <DecisionSimulation data={a} mode={slide.activityMode ?? 'both'} onDone={() => onActivityDone(slide.id)} />
            )}
          </div>
        </div>
      </div>
      </StorySlideShell>
    );
  }

  // Quiz
  if (slide.kind === 'quiz' && slide.quiz) {
    return (
      <QuizStorySlide
        slide={slide}
        spoken={spoken}
        muted={muted}
        showDialogue={showDialogue}
        onQuizComplete={onQuizComplete}
      />
    );
  }

  // Reflection
  if (slide.kind === 'reflection' && slide.reflection) {
    return (
      <StorySlideShell slide={slide} spoken={spoken} showDialogue={showDialogue}>
        <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-fade-in">
        <TitleHead slide={slide} />
        <p className="my-4 inline-flex items-center gap-2 rounded-full bg-gold-500/10 px-4 py-1.5 text-base font-semibold text-gold-600">
          <Icon name="sparkles" className="w-5 h-5" />
          أسئلة تأمّل مفتوحة — لا إجابة واحدة صحيحة، الهدف منها النقاش لا التقييم.
        </p>
        <div className="grid w-full max-w-5xl grid-cols-3 gap-3">
          {slide.reflection.map((q, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-4 text-right shadow-card">
              <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-gold-500/15 text-gold-600 font-bold tabular">
                {toArabicDigits(i + 1)}
              </span>
              <p className="text-[20px] font-bold leading-relaxed text-ink">{q}</p>
            </div>
          ))}
        </div>
      </div>
      </StorySlideShell>
    );
  }

  // Completion
  if (slide.kind === 'completion') {
    return (
      <StorySlideShell slide={slide} spoken={spoken} showDialogue={showDialogue}>
        <div className="relative flex h-full flex-col items-center justify-center gap-4 p-10 pt-14 text-center">
        <Confetti count={48} />
        <div className="flex justify-center animate-scale-in">
          <CompletionMedallion className="h-20 w-20 animate-float" />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-strong animate-fade-up">{slide.title}</h2>
        <div className="w-full max-w-5xl animate-fade-up text-right">
          {slide.content?.takeaways && <LessonBlockView block={slide.content.takeaways} />}
        </div>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-ink tabular">{toArabicDigits(completion.percent)}٪</p>
            <p className="text-xs text-ink-muted">نسبة الإتمام</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-ink tabular">
              {completion.quizScore === null ? '—' : `${toArabicDigits(completion.quizScore)}٪`}
            </p>
            <p className="text-xs text-ink-muted">نتيجة الاختبار</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-extrabold text-ink tabular">
              {toArabicDigits(completion.activitiesDone)}/{toArabicDigits(completion.totalActivities)}
            </p>
            <p className="text-xs text-ink-muted">الأنشطة المكتملة</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={completion.onExit} className="btn-gold px-7 py-4 text-lg">
            <Icon name="flag" className="w-5 h-5" />
            إنهاء والعودة للمنصة
          </button>
          <button type="button" onClick={completion.onRestart} className="btn-ghost px-7 py-4 text-lg">
            <Icon name="flow" className="w-5 h-5" />
            إعادة الفصل
          </button>
        </div>
      </div>
      </StorySlideShell>
    );
  }

  return null;
}
