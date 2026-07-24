import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Beat, BeatUnit, PptCard, PptLayout, Slide } from '../../types/slides';
import type { QuizQuestion } from '../../types/course';
import { Icon } from '../ui/Icon';
import { CompletionMedallion } from '../ui/Badge';
import { Confetti } from '../ui/Confetti';
import { LessonBlockView } from '../course/LessonBlocks';
import { ClassificationActivity } from '../activities/ClassificationActivity';
import { FlipCardActivity } from '../activities/FlipCardActivity';
import { DecisionSimulation } from '../activities/DecisionSimulation';
import { TrueFalseGame } from '../activities/TrueFalseGame';
import { KnowledgeCheck } from '../activities/KnowledgeCheck';
import { POSE_SRC, POSE_SRC_BAG2, type NasserPose } from '../character/Nasser';
import { SpeechBubble } from '../character/SpeechBubble';
import { toArabicDigits } from '../../lib/utils';
import { activeStoryCue, storyCues, timeFromAudioAlignment } from '../../lib/storyTiming';
import { activePptCardForCue, pptCardCueIndexes, pptCardRevealOffsets, scorePptCardCue } from '../../lib/pptTiming';
import { useNarrationContext } from '../audio/NarrationContext';
import { useVoiceSync } from '../../hooks/useVoiceSync';
import { useCanvasPortal } from '../../lib/canvasScale';
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
  { border: 'border-gold-400/80', tile: 'bg-gold-500/22 text-gold-700' },
  { border: 'border-green-400/70', tile: 'bg-green-500/18 text-green-700' },
  { border: 'border-gold-400/80', tile: 'bg-gold-500/22 text-gold-700' },
];

const ACTIVE_BOX = 'border-green-600 bg-green-700 shadow-glow';

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

function questionPose(side: 'left' | 'right'): NasserPose {
  return side === 'left' ? 'questionRight' : 'questionLeft';
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
    return questionPose(side);
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
      'كارثة',
      'تهديد',
      'فشل الاستجابة',
      'انهيار',
      'شلل التحليل',
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
      'نموذج',
      'مصفوفة',
      'مراحل',
      'خطوة',
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
  compactActivity,
}: {
  slide: Slide;
  spoken: number;
  showDialogue: boolean;
  dialogueOverride?: string;
  compactActivity?: boolean;
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
  const keepsLargePresence = slide.layout === 'pptIntro' || slide.id === 'program-map' || slide.id.endsWith('-welcome');
  const isQuiz = slide.kind === 'quiz';
  const compact = isPpt || slide.kind === 'activity' || slide.kind === 'quiz' || slide.kind === 'reflection';
  // Client call: make Nasser noticeably larger across every slide kind, and
  // scale the dialogue bubble text next to him to match (see SpeechBubble).
  const imageSize = compactActivity
    ? 'h-[176px] w-[176px]'
    : isPpt
    ? keepsLargePresence
      ? 'h-[300px] w-[300px]'
      : 'h-[258px] w-[258px]'
    : isQuiz
      ? 'h-[214px] w-[214px]'
      : compact
        ? 'h-[268px] w-[268px]'
        : 'h-[330px] w-[330px]';
  const layerHeight = compactActivity ? 'h-[156px]' : isPpt ? (keepsLargePresence ? 'h-[262px]' : 'h-[220px]') : isQuiz ? 'h-[188px]' : compact ? 'h-[238px]' : 'h-[282px]';
  const bottomOffset = compactActivity ? 'bottom-[8px]' : isPpt ? 'bottom-[14px]' : isQuiz ? 'bottom-[18px]' : 'bottom-[30px]';
  const rowDirection = guide.side === 'right' ? 'flex-row-reverse' : 'flex-row';
  const justify = guide.side === 'right' ? 'justify-end' : 'justify-start';
  const bubbleLift = compactActivity ? 'mb-2' : isQuiz ? 'mb-3' : compact ? 'mb-6' : 'mb-10';
  const bubbleTail = guide.side === 'right' ? 'left' : 'right';
  const speakingPose = semanticPose(line, guide.side, guide.pose);
  const displayPose = isPpt && !showDialogue ? 'welcome' : speakingPose;
  const isEmergencySlide = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  const poseSrc = isEmergencySlide ? POSE_SRC_BAG2 : POSE_SRC;
  const stripDiacritics = (value: string) =>
    value.replace(/[\u0610-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]/gu, '');
  const displayLine = stripDiacritics(line);
  const displaySpokenPart = cueSpokenSplit ? stripDiacritics(cueSpokenSplit.spokenPart) : displayLine;
  const displayRemainingPart = cueSpokenSplit ? stripDiacritics(cueSpokenSplit.remainingPart) : '';

  return (
    <div data-nasser-layer="true" className={`pointer-events-none absolute inset-x-0 ${bottomOffset} ${compactActivity ? 'z-30' : 'z-50'} ${layerHeight} overflow-visible px-7 pb-3`}>
      <div className={`flex h-full w-full items-end ${justify}`}>
        <div className={`flex max-w-[980px] items-end gap-3 ${rowDirection}`}>
          <img
            key={displayPose}
            src={poseSrc[displayPose]}
            alt="ناصر المدرب"
            className={`${imageSize} shrink-0 object-contain object-bottom drop-shadow-2xl`}
            loading="eager"
            decoding="async"
            fetchPriority="high"
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
  isActivityShot,
  hideNasser,
  children,
}: {
  slide: Slide;
  spoken: number;
  showDialogue: boolean;
  dialogueOverride?: string;
  /** How many of the slide's cards are currently revealed — lets the
   *  ornament fill the still-empty canvas before the first card appears. */
  revealedCount?: number;
  /** The slide's final shot is a real interactive activity (MCQ, drag-drop,
   *  flip cards, true/false) rather than a narrated card scene -- those
   *  components need far more vertical room than the usual card layout, so
   *  they get a much smaller Nasser-reservation band than other ppt shots. */
  isActivityShot?: boolean;
  hideNasser?: boolean;
  children: React.ReactNode;
}) {
  const isPpt = Boolean(slide.layout?.startsWith('ppt'));
  const isQuiz = slide.kind === 'quiz';
  const compact = slide.kind === 'activity' || slide.kind === 'quiz' || slide.kind === 'reflection' || slide.kind === 'completion';
  const isGuidedPptActivity = slide.layout === 'pptActivitySort' || slide.layout === 'pptScenario';
  // The intro/roadmap hero scenes compose their own full-bleed illustration
  // and place their own CTA button — they don't need the full Nasser-height
  // reservation every other ppt slide gets, and that reserved band was
  // leaving a large dead zone under the visual on the right (Nasser only
  // occupies the left). Give them most of that space back.
  const isIntroMotion = slide.layout === 'pptIntro' || slide.id === 'program-map';
  const bottomSpace = isActivityShot ? 'pb-[40px]' : isIntroMotion ? 'pb-[104px]' : isGuidedPptActivity ? 'pb-[184px]' : isPpt ? 'pb-[232px]' : isQuiz ? 'pb-[172px]' : compact ? 'pb-[254px]' : 'pb-[292px]';
  const topSpace = isActivityShot ? 'pt-[56px]' : isIntroMotion ? 'pt-[64px]' : isGuidedPptActivity ? 'pt-[72px]' : isPpt ? 'pt-[86px]' : isQuiz ? 'pt-[68px]' : compact ? 'pt-[92px]' : 'pt-[106px]';
  void revealedCount;

  return (
    <div className="relative isolate h-full overflow-hidden">
      <div data-slide-content="true" className={`relative z-40 h-full px-[70px] ${topSpace} ${bottomSpace}`}>{children}</div>
      {!hideNasser && (
        <NasserStoryLayer
          slide={slide}
          spoken={spoken}
          showDialogue={showDialogue}
          dialogueOverride={dialogueOverride}
          compactActivity={isActivityShot}
        />
      )}
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
        ? 'border-green-600 bg-green-700 text-white'
        : active
          ? `${ACTIVE_BOX} text-white`
          : unit.tone === 'gold'
            ? 'border-gold-400/70 bg-gold-500/10'
            : 'border-green-400/70 bg-green-500/10';
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
      className={`relative grid h-full w-[220px] shrink-0 place-items-center overflow-visible ${
        alt ? 'rounded-[2.5rem]' : 'rounded-3xl'
      } border-2 border-green-500/35 shadow-card-lg ${
        alt ? 'bg-green-700/28' : 'bg-green-600/28'
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
        active ? 'scale-110 bg-green-700' : 'bg-green-500'
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
        active ? 'scale-110 bg-green-700' : 'bg-gold-500'
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
    <div className="relative flex h-32 min-w-[220px] flex-1 items-end justify-between overflow-visible rounded-3xl border-2 border-green-500/30 bg-green-500/16 px-5 shadow-card">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(rgb(0 135 85 / 0.35) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
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
        className={`absolute bottom-7 top-7 z-0 w-1 rounded-full bg-green-500/60 ${
          mirror ? 'left-[19px]' : 'right-[19px]'
        } ${spineDashed ? 'opacity-70 [background-image:repeating-linear-gradient(180deg,rgb(0_135_85/0.6)_0_10px,transparent_10px_18px)] [background-color:transparent]' : ''}`}
      />
      {flowRows}
    </div>
  );

  const topDownFlow = (
    <div className="relative grid min-h-0 flex-1 grid-cols-2 content-center gap-3.5">
      <span className="absolute left-6 right-6 top-1/2 z-0 h-1 -translate-y-1/2 rounded-full bg-green-500/55" />
      {flowRows}
    </div>
  );

  return (
    <StorySlideShell slide={slide} spoken={spoken} showDialogue={showDialogue}>
      <div className="flex h-full flex-col px-9 py-5">
      {/* title (beat 0) */}
      <h2 className={`flex items-center gap-3 text-[30px] font-extrabold leading-tight transition-colors ${activeIdx === 0 ? 'text-brand' : 'text-brand-strong'}`}>
      <span className={`grid h-14 w-14 shrink-0 place-items-center bg-green-700 p-2 text-white shadow-card ${alt ? 'rounded-full' : 'rounded-2xl'}`}>
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

/** Pool of small looping highlight animations for whichever card image is
 *  "currently being talked about" — one is picked at random every time a
 *  different card becomes active, so the same motion doesn't repeat on
 *  every slide (see pickFocusAnimation below). */
const FOCUS_ANIMATIONS = [
  'motion-focus-glow',
  'motion-focus-beat',
  'motion-focus-bounce',
  'motion-focus-float',
  'motion-focus-tilt',
  'motion-focus-zoom',
  'motion-focus-swing',
  'motion-focus-wiggle',
  'motion-focus-pop',
];

function pickFocusAnimation(exclude?: string) {
  const pool = exclude ? FOCUS_ANIMATIONS.filter((name) => name !== exclude) : FOCUS_ANIMATIONS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Matches each .motion-focus-* keyframe's `animation-duration` in
 *  styles/index.css, so we know how long one loop takes. */
const FOCUS_ANIMATION_DURATIONS_MS: Record<string, number> = {
  'motion-focus-glow': 2400,
  'motion-focus-beat': 2300,
  'motion-focus-bounce': 2300,
  'motion-focus-float': 2600,
  'motion-focus-tilt': 2500,
  'motion-focus-zoom': 2400,
  'motion-focus-swing': 2600,
  'motion-focus-wiggle': 2400,
  'motion-focus-pop': 2300,
};

const VISUAL_ACTIVE_ANIMATIONS = [
  'visual-active-float',
  'visual-active-pulse',
  'visual-active-orbit',
  'visual-active-scan',
  'visual-active-spark',
  'visual-active-sway',
  'visual-active-alert',
  'visual-active-flow',
];

function activeVisualAnimationFor(text: string, index = 0) {
  if (text.includes('emergency-intro-preparedness-command-layer') || text.includes('emergency-intro-preparedness-layer')) return 'visual-active-breathe';
  if (text.includes('emergency-intro-crisis-layer')) return 'visual-active-spin-pulse';
  if (text.includes('emergency-intro-foresight-layer')) return 'visual-active-scan';
  if (/تحذير|خطر|مخاطر|أزمة|طارئ|ضغط|إنذار|جرس|بلاغ|كارثة/.test(text)) return 'visual-active-alert';
  if (/هدف|مؤشر|قياس|رصد|استشراف|مسح|تحليل|متابعة|لوحة/.test(text)) return 'visual-active-scan';
  if (/تواصل|اتصال|شبكة|أصحاب|توريد|سلسلة|تدفق|إجراءات|مسار|خطة/.test(text)) return 'visual-active-flow';
  if (/قيادة|فريق|لجنة|مجلس|حوكمة|مركز|تنسيق|استجابة/.test(text)) return 'visual-active-orbit';
  if (/امتثال|تدقيق|ضوابط|توثيق|سجل|سياسة|دليل|مراجعة/.test(text)) return 'visual-active-pulse';
  if (/تعافي|استمرارية|جاهزية|حماية|درع|أمان/.test(text)) return 'visual-active-sway';
  const seed = stableIconIndex(`${text}:${index}`);
  return VISUAL_ACTIVE_ANIMATIONS[seed % VISUAL_ACTIVE_ANIMATIONS.length];
}

function activeVisualClass(active: boolean, text: string, index = 0) {
  return active ? activeVisualAnimationFor(text, index) : '';
}

/** Brand icons are single-silhouette PNGs. Instead of baking one fixed
 *  color into the asset (or approximating a recolor with CSS filters, which
 *  only really gets you to white), render them as a CSS mask: the icon file
 *  supplies the shape via its alpha channel, and `background-color` -- any
 *  Tailwind color, chosen per call site -- supplies the color. One asset
 *  then renders correctly in primary green, secondary gold, white, or any
 *  other tone a background needs, with no per-color asset variants.
 *  Only for flat brand-icon silhouettes (`sharedBrandIconFor`); the
 *  multi-color topic illustrations from `pptGeneratedVisualLayersFor` stay
 *  plain <img> tags -- masking would flatten their own internal color. */
type BrandIconTone = 'primary' | 'secondary' | 'white' | 'ink';

const BRAND_ICON_TONE_CLASS: Record<BrandIconTone, string> = {
  primary: 'bg-brand',
  secondary: 'bg-[#9B945F]',
  white: 'bg-white',
  ink: 'bg-ink',
};

function BrandIcon({
  src,
  tone = 'primary',
  className = '',
}: {
  src: string;
  tone?: BrandIconTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 ${BRAND_ICON_TONE_CLASS[tone]} ${className}`}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
      }}
    />
  );
}

function pptEmojiFor(card: PptCard, fallback?: string, index = 0) {
  const text = `${card.title} ${card.text ?? ''}`;
  const match = PPT_EMOJIS.find((item) => item.terms.some((term) => text.includes(term)));
  const base = match?.emoji ?? fallback ?? '💡';
  const variants = PPT_EMOJI_VARIANTS[base];
  return variants?.[index % variants.length] ?? base;
}

/** Short practical tip shown when a card is expanded — must stay on-topic
 *  for whichever bag the card belongs to. `forceEmergency` is passed by
 *  callers that already know the slide is bag-2 (via `slide.id`), because
 *  many bag-2 card titles are short generic labels ("تتعدد مراكز القرار
 *  أم تُوحّد؟", "المسؤول عن التنفيذ") that don't contain an obvious
 *  emergency-management keyword on their own -- detecting from the card's
 *  own text alone would misroute those to bag-1's governance tips. */
function pptDetailFor(card: PptCard, forceEmergency = false) {
  if (card.rationale) return card.rationale;
  const text = `${card.title} ${card.text ?? ''}`;
  const isEmergencyTopic = forceEmergency || /طوارئ|أزمة|أزمات|كارثة|حادث|الاستجابة/.test(text);

  if (isEmergencyTopic) {
    if (/RACI|مسؤول عن التنفيذ|المساءَل|استشارته|إعلامه/.test(text)) {
      return 'حدد صاحب الدور بدقة قبل أن تبدأ الأزمة، لا أثناءها.';
    }
    if (/حدث|طارئ|كارثة|أزمة/.test(text)) {
      return 'اربط المستوى بحجم التعطل ونوع القرار المطلوب.';
    }
    if (/قيادة|قائد|مركز القيادة|مركز قيادة|ICS|EOC/.test(text)) {
      return 'وضّح من يقود، ومن يُبقى على اطلاع، وحدود التفويض.';
    }
    if (/استمرارية|التعافي|الموارد الحيوية|العمليات الحرجة/.test(text)) {
      return 'حدد الحد الأدنى المقبول من الخدمة ومتى يبدأ التعافي.';
    }
    if (/تواصل|إعلام|الثقة|رسائل|المتحدث/.test(text)) {
      return 'كن أول من يتحدث، وكن دقيقًا، وأظهر التعاطف.';
    }
    if (/قرار|OODA|تصعيد|تحت الضغط/.test(text)) {
      return 'حلل الموقف قبل أن تقرر، لا تتفاعل بسرعة بدون تحليل.';
    }
    if (/استشراف|مسح|PESTLE|سيناريو/.test(text)) {
      return 'راقب الإشارات المبكرة قبل أن تتحول إلى أزمة فعلية.';
    }
    if (/خطر|أخطار|هشاشة|مصفوفة/.test(text)) {
      return 'قيّم الاحتمالية والأثر معًا قبل ترتيب الأولويات.';
    }
    if (/ترصد|إنذار مبكر|عتبة/.test(text)) {
      return 'حدد مستوى العتبة الذي يُفعّل الإنذار قبل فوات الأوان.';
    }
    if (/سلسلة التوريد|لوجست|مخزون|موردين/.test(text)) {
      return 'اضمن بديلًا جاهزًا قبل أن يتعطل المصدر الأساسي.';
    }
    if (/مراجعة ما بعد|الدروس المستفادة|تحسين/.test(text)) {
      return 'وثّق الدرس واربطه بخطة تحسين لها مالك ومتابعة.';
    }
    if (/مؤشر|KPI|لوحة معلومات/.test(text)) {
      return 'اربط المؤشر بقرار فعلي، لا رقم بدون أثر.';
    }
    if (/أصحاب المصلحة|القوة والاهتمام/.test(text)) {
      return 'صنّف كل طرف حسب قوته واهتمامه، وخصص التواصل له.';
    }
    return 'اربط النقطة بموقف طارئ فعلي وحدد من يقرر ومتى.';
  }

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
  const { isPlaying: narrationLocked } = useNarrationContext();
  if (phase === 'idle' || phase === 'done') return null;
  const revealed = phase === 'revealed';
  const ready = phase === 'ready' && !narrationLocked;
  return (
    <div className="absolute inset-0 z-20 grid place-items-start pt-[104px]" aria-live="polite">
      {/* Once Nasser has answered, tapping anywhere outside the card dismisses
          it and returns to the normal slide view — only active post-reveal
          so the learner can't skip past the question itself. */}
      <div
        className={`absolute inset-0 bg-ink/35 backdrop-blur-[2px] animate-fade-in ${revealed && !narrationLocked ? 'cursor-pointer' : 'pointer-events-none'}`}
        onClick={revealed && !narrationLocked ? onDismiss : undefined}
      />
      <div
        className={`pointer-events-auto relative mx-auto w-full max-w-[720px] animate-scale-in overflow-visible rounded-2xl border-2 shadow-card-lg transition-colors duration-500 ${
          revealed
            ? 'border-green-700 bg-green-700 text-white'
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
              className={`rounded-lg bg-green-700 px-6 py-3 text-[16px] font-extrabold text-white shadow-card transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
                ready ? 'animate-pulse-ring' : ''
              }`}
            >
              {ready ? 'فكّرت.. اكشف الإجابة' : 'استمع للسؤال…'}
            </button>
          </div>
        ) : (
          <div className="flex justify-center pb-4">
            <button
              type="button"
              disabled={narrationLocked}
              onClick={onDismiss}
              className="text-[13px] font-bold text-green-50/80 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
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
    .slice(0, 4)
    .map((label, index) => ({
      label,
      detail: ['مدخل بصري', 'تطبيق عملي', 'قرار أوضح', 'تحسين مستمر'][index],
    }));
}

function roadmapPillars(slide: Slide) {
  const cards = slide.ppt?.cards ?? [];
  return cards.slice(0, 4).map((card, index) => ({
    label: card.title.includes(':') ? card.title.slice(card.title.indexOf(':') + 1).trim() : card.title,
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
  const { isPlaying: narrationLocked } = useNarrationContext();
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
  const isEmergencyWelcome = slide.id === 'emergency-welcome';
  // Every chapter has its own welcome/pptIntro slide (ec1-welcome,
  // ec2-welcome, ...), not just the bag-2 top-level intro -- all of them
  // need this same needle-based sync, not just the one slide that
  // originally got hand-picked phrases. The bag-2 intro's own pillar
  // labels are a paraphrase that doesn't appear verbatim in its narration
  // (hence its hand-picked needles below), but every chapter welcome's
  // pillar labels ARE lifted verbatim from that slide's own narration --
  // see introPillars()/ppt.intro -- so using the pillar's own label text
  // as the needle works generically for the rest of them.
  const isEmergencyCourse = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  const firstPillarShown = isEmergencyWelcome
    ? spokenPast('الفصل الأول عن الاستعداد للطوارئ', 0.2)
    : isEmergencyCourse
      ? spokenPast(pillars[0]?.label ?? '', 0.2)
      : spokenPast('بنمشي سوا من بناء الحوكمة', 0.52);
  const secondPillarShown = isEmergencyWelcome
    ? spokenPast('الفصل الثاني عن إدارة الأزمة نفسها', 0.41)
    : isEmergencyCourse
      ? spokenPast(pillars[1]?.label ?? '', 0.41)
      : spokenPast('إلى الامتثال واختبار الضوابط', 0.62);
  const thirdPillarShown = isEmergencyWelcome
    ? spokenPast('الفصل الثالث عن استشراف المستقبل', 0.53)
    : isEmergencyCourse
      ? spokenPast(pillars[2]?.label ?? '', 0.53)
      : spokenPast('ثم نختم بإدارة المخاطر', 0.72);
  // Only the bag-level welcome slide has a real 4th pillar (chapter 4) --
  // every chapter's own welcome slide covers just its own 3 sub-topics.
  const fourthPillarShown = isEmergencyWelcome
    ? spokenPast('الفصل الرابع عن التعافي والتحسين المستمر', 0.65)
    : isEmergencyCourse && pillars[3]
      ? spokenPast(pillars[3].label, 0.65)
      : false;
  // Client call: nothing appears until Nasser actually talks about it --
  // no "everything visible up front" state. Each flag gates both whether
  // its layer/card is shown at all AND (while it's the newest one revealed)
  // the "currently talking about this" active highlight.
  const activeIndex = fourthPillarShown ? 3 : thirdPillarShown ? 2 : secondPillarShown ? 1 : 0;
  const visiblePillars = started
    ? fourthPillarShown
      ? 4
      : thirdPillarShown
        ? 3
        : secondPillarShown
          ? 2
          : firstPillarShown
            ? 1
            : 0
    : 0;
  // Bag 2 (emergency response) welcome slides get their own themed hero
  // image instead of bag 1's governance building scene. Only one image --
  // the client wants a single, most-expressive visual here instead of a
  // cluster of three -- raised toward the top so the pillar cards docked
  // at the bottom of this scene never crop it.
  // Vercel serves /assets/visual-library/* with a one-year immutable
  // cache-control header, so a visitor whose browser already cached the old
  // pixels never re-checks after we edit the file in place -- append a
  // manual version query so updating this file always busts the cache.
  const introHeroSrc = isEmergencyCourse
    ? '/assets/visual-library/intro-emergency-preparedness-shield.webp?v=3'
    : '/assets/visual-library/intro-governance-building-scene.webp';
  // Keep the pillar row's horizontal center locked to the hero image's own
  // center (both anchored from the right edge) so it never reads as
  // shifted off to one side, regardless of how many pillars are shown.
  const heroRightPct = 6;
  const heroWidthPct = 26;
  const heroCenterFromRight = heroRightPct + heroWidthPct / 2;
  const pillarRowWidthPct = pillars.length > 3 ? 38 : 30;
  const pillarRowRightPct = heroCenterFromRight - pillarRowWidthPct / 2;

  return (
    <div className="relative h-full min-h-0 overflow-visible">
      <div className="pointer-events-none absolute inset-0">
        <img
          src={introHeroSrc}
          alt=""
          draggable={false}
          className={`absolute right-[6%] top-[8%] w-[26%] drop-shadow-[0_18px_24px_rgb(24_82_55_/_0.16)] transition-all duration-1000 ease-out ${
            started ? 'translate-y-0 scale-100 opacity-100 blur-0' : 'translate-y-5 scale-95 opacity-0 blur-0'
          } ${started && !narrationComplete ? `motion-layer-focus ${activeVisualAnimationFor(introHeroSrc, 0)}` : ''}`}
          style={{
            transform: started
              ? `translate3d(${(1 - visualProgress) * 10}px, ${Math.sin(visualProgress * Math.PI * 2) * 2}px, 0) scale(${0.98 + visualProgress * 0.025})`
              : undefined,
          }}
        />
        <div
          className="absolute flex items-end justify-center gap-2 transition-all duration-1000 ease-out"
          style={{ right: `${pillarRowRightPct}%`, bottom: '10%', width: `${pillarRowWidthPct}%` }}
        >
        {/* Governance's 3-pillar slide reorders visually (governance-middle,
            compliance-left, risk-right) per an old client request, without
            touching the reveal-order array. Emergency slides instead need
            strict chapter-1-to-4 left-to-right order, so they skip that
            reorder entirely. */}
        {pillars.map((pillar, index) => {
          const shown = index < visiblePillars;
          const active = started && !narrationComplete && index === activeIndex;
          const cardWidth = pillars.length > 3 ? 'w-[98px]' : 'w-[100px]';
          const visualOrder = isEmergencyCourse ? index : index < 3 ? [1, 2, 0][index] : index;
          return (
            <div
              key={`intro-label-${pillar.label}`}
              className={`${cardWidth} shrink-0 rounded-2xl border px-3 py-3 text-center shadow-sm backdrop-blur-md transition-all duration-[900ms] ease-out ${
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
              <p className={`${pillars.length > 3 ? 'text-[12px]' : 'text-[14px]'} font-black leading-tight`}>{pillar.label}</p>
              <p className={`mt-1 ${pillars.length > 3 ? 'text-[10px]' : 'text-[11px]'} font-extrabold leading-snug ${active ? 'text-green-50' : 'text-ink'}`}>{pillar.detail}</p>
            </div>
          );
        })}
        </div>
      </div>

      <div className="relative z-10 flex h-full min-h-0 flex-col justify-between px-6 py-5 text-right">
        <div className="mr-auto w-[56%] animate-fade-up">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-green-700/18 bg-white/78 px-4 py-1.5 text-[13px] font-extrabold text-green-800 shadow-sm backdrop-blur-sm">
              تحت إشراف المدرب ناصر
            </span>
            <span className="rounded-full border border-gold-500/25 bg-gold-50/78 px-4 py-1.5 text-[13px] font-extrabold text-gold-700 shadow-sm backdrop-blur-sm">
              بداية الرحلة
            </span>
          </div>

          <p className="mb-2 text-[18px] font-extrabold text-green-800">{slide.ppt?.courseName}</p>
          {slide.ppt?.subtitle && (
            <p className="mb-2 w-fit rounded-lg bg-green-700 px-4 py-1.5 text-[16px] font-extrabold text-white shadow-card">
              {slide.ppt.subtitle}
            </p>
          )}
          <h2 className="text-[30px] font-black leading-[1.18] text-brand-strong drop-shadow-[0_2px_0_rgb(255_255_255_/_0.8)]">
            {slide.ppt?.unitTitle ?? slide.title}
          </h2>
          <p className="mt-3 max-w-[560px] text-[16px] font-bold leading-relaxed text-ink-soft">
            {slide.ppt?.intro}
          </p>
        </div>

        <div className="absolute bottom-[150px] left-[365px] flex items-center justify-end">
          <button
            type="button"
            disabled={narrationLocked}
            onClick={onStart}
            className={`btn-gold shrink-0 px-8 py-3.5 text-[18px] shadow-card disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
              narrationLocked ? '' : 'animate-pulse-ring'
            }`}
          >
            <Icon name="flag" className="h-6 w-6" />
            {started ? 'استمع للمقدمة' : 'لنبدأ'}
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
  const spokenPast = (needles: string | string[], fallback: number) => {
    const list = Array.isArray(needles) ? needles : [needles];
    const index = list.reduce((found, n) => (found >= 0 ? found : slide.narration.indexOf(n)), -1);
    return started && (visualProgress >= fallback || (index >= 0 && effectiveSpoken >= index));
  };
  const firstStepShown = spokenPast(['أول فكرة معنا', 'الفكرة الأولى هي الفصل الأول'], 0.18);
  const secondStepShown = spokenPast(['بعد ما تتضح البداية', 'وبعد أن تتضح البداية'], 0.42);
  const thirdStepShown = spokenPast('ثم نصل إلى الفصل الثالث', 0.64);
  const fourthStepShown = spokenPast('وأخيرًا الفصل الرابع', 0.82);
  // Client call: nothing appears until Nasser actually talks about it.
  const current = fourthStepShown ? 3 : thirdStepShown ? 2 : secondStepShown ? 1 : 0;
  const visibleStepCount = started ? (fourthStepShown ? 4 : thirdStepShown ? 3 : secondStepShown ? 2 : firstStepShown ? 1 : 0) : 0;
  const roadmapArrows = [
    { d: 'M720 210 C626 184 552 158 478 158', color: 'rgb(31 105 72)', delay: '0ms' },
    { d: 'M720 252 C628 250 552 250 478 250', color: 'rgb(191 155 74)', delay: '90ms' },
    { d: 'M720 294 C628 310 552 336 478 342', color: 'rgb(23 150 132)', delay: '180ms' },
    { d: 'M720 336 C622 384 540 438 478 436', color: 'rgb(104 112 118)', delay: '270ms' },
  ];
  const chapterGlyphs: CourseGlyphKind[] = ['strategicFramework', 'crisisComm', 'earlyWarning', 'afterAction'];
  const orderedPillars = pillars;
  const cleanRoadmapTitle = (label: string) => label.replace(/^الفصل\s+(الأول|الثاني|الثالث|الرابع)\s*[:：\-–—]?\s*/u, '');

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
            const activeArrow = started && !narrationComplete && index === current;
            return (
              <path
                key={arrow.d}
                d={arrow.d}
                fill="none"
                stroke={arrow.color}
                strokeWidth={activeArrow ? 7 : 5}
                strokeLinecap="round"
                markerEnd={`url(#roadmap-arrow-${index})`}
                className={`transition-all duration-700 ease-out ${visible ? 'opacity-80' : 'opacity-0'}`}
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
        <div className="absolute right-[-2%] z-10 flex w-[32%] items-center justify-center gap-2 text-center" style={{ top: 150 }}>
          <span className="grid h-[170px] w-[170px] shrink-0 place-items-center p-0 animate-float">
            <CourseGlyph kind="target" />
          </span>
          <h2 className="max-w-[270px] text-center text-[36px] font-black leading-tight text-brand-strong drop-shadow-[0_2px_0_rgb(255_255_255_/_0.9)]">
            محتويات الحقيبة
          </h2>
        </div>

        <div className="absolute flex flex-col gap-3" style={{ left: '5%', top: 86, width: '46%' }}>
          {orderedPillars.map((pillar, index) => {
            const shown = index < visibleStepCount;
            const active = started && !narrationComplete && index === current;
            return (
              <div
                key={pillar.label}
                className={`relative flex items-center gap-3 overflow-visible rounded-[18px] border px-3 py-2 text-right shadow-[0_16px_30px_rgb(24_82_55_/_0.10)] backdrop-blur-md transition-all duration-700 ${
                  shown ? 'translate-x-0 scale-100 opacity-100' : 'pointer-events-none -translate-x-10 scale-95 opacity-0'
                } ${
                  active
                    ? 'z-20 translate-x-2 scale-[1.02] border-gold-500/55 bg-green-700 text-white shadow-card-lg'
                    : 'border-green-700/14 bg-white/88 text-brand-strong'
                }`}
                style={{ minHeight: 76 }}
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 ${active ? 'bg-gold-500' : 'bg-green-700/35'}`} />
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border text-[22px] font-black tabular-nums ${
                    active ? 'border-white/30 bg-white/16 text-white' : 'border-green-700/16 bg-white/88 text-green-800'
                  }`}>
                  {toArabicDigits(index + 1)}
                </span>
                <span
                  className={`grid h-[60px] w-[68px] shrink-0 place-items-center rounded-[20px] border bg-white/90 p-2 transition-all duration-700 ${
                    active ? 'motion-layer-focus border-white/40 shadow-[0_16px_24px_rgb(0_0_0_/_0.12)]' : 'border-green-700/12 drop-shadow-[0_14px_20px_rgb(24_82_55_/_0.10)]'
                  }`}
                  style={{ transform: shown ? `translate3d(${Math.sin(visualProgress * (6 + index)) * 2}px, ${Math.cos(visualProgress * (5 + index)) * 1.5}px, 0)` : undefined }}
                  aria-hidden="true"
                >
                  <CourseGlyph kind={chapterGlyphs[index] ?? 'default'} compact />
                </span>
                <div className="flex min-w-0 flex-1 items-center justify-center text-center">
                  <h3 className="text-[20px] font-black leading-[1.16]">{cleanRoadmapTitle(pillar.label)}</h3>
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
  | 'default'
  | 'commandCenter'
  | 'strategicFramework'
  | 'continuityShield'
  | 'crisisComm'
  | 'decisionPressure'
  | 'proactiveScan'
  | 'riskGrid'
  | 'earlyWarning'
  | 'supplyChain'
  | 'afterAction'
  | 'kpiDashboard'
  | 'stakeholderNetwork';

function courseGlyphKind(text: string): CourseGlyphKind {
  if (/ICS|EOC|قائد الحادث|مركز عمليات الطوارئ|مركز القيادة|التنسيق أثناء الطوارئ/.test(text)) return 'commandCenter';
  if (/الإطار الاستراتيجي|خطط الطوارئ|الجاهزية المؤسسية|التكامل بين الجهات/.test(text)) return 'strategicFramework';
  if (/استمرارية الأعمال|التعافي|الموارد الحيوية|العمليات الحرجة/.test(text)) return 'continuityShield';
  if (/تواصل|إعلام|رسائل|CERC|الثقة/.test(text)) return 'crisisComm';
  if (/اتخاذ القرار|OODA|شلل التحليل|معايير التصعيد|تحت الضغط/.test(text)) return 'decisionPressure';
  if (/استشراف|مسح|PESTLE/.test(text)) return 'proactiveScan';
  if (/أصحاب المصلحة|Stakeholders|القوة والاهتمام/.test(text)) return 'stakeholderNetwork';
  if (/متعددة الأخطار|الهشاشة|التعرض|خريطة المخاطر|مصفوفة/.test(text)) return 'riskGrid';
  if (/ترصد|إنذار|SMART-ER|مستويات العتبة/.test(text)) return 'earlyWarning';
  if (/لوجستيات|مخزون|توريد|نوبكو|الموردين|مرونة سلسلة/.test(text)) return 'supplyChain';
  if (/مراجعة ما بعد الحدث|AAR|الدروس المستفادة|خطة التحسين|PDCA/.test(text)) return 'afterAction';
  if (/مؤشرات الأداء|KPI|لوحة معلومات|Dashboard/.test(text)) return 'kpiDashboard';
  if (/طوارئ|أزمة|أزمات|كارثة|حادث/.test(text)) return 'risk';
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
  const stroke = active ? 'rgb(213 238 225)' : 'rgb(31 105 72)';
  const accent = active ? 'rgb(246 211 122)' : 'rgb(191 155 74)';
  const muted = active ? 'rgb(213 238 225 / 0.58)' : 'rgb(47 132 87 / 0.28)';
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
        <circle cx="48" cy="56" r="30" fill="rgb(226 242 234 / 0.52)" stroke={stroke} strokeWidth={strokeWidth - 0.8} />
        <circle cx="48" cy="56" r="19" fill="none" stroke={stroke} strokeWidth={strokeWidth + 0.4} />
        <circle cx="48" cy="56" r="7" fill={accent} stroke={stroke} strokeWidth={strokeWidth - 1.2} />
        <path {...common} d="M60 44l23-23M72 21h11v11" stroke={accent} strokeWidth={strokeWidth + 0.8} />
        <path {...common} d="M62 42l-14 14" stroke={accent} strokeWidth={strokeWidth + 1} />
      </>
    ),
    default: (
      <>
        <path {...common} d="M52 18l28 16v32L52 82 24 66V34z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M36 52h32M52 36v32" stroke={accent} strokeWidth={strokeWidth} />
      </>
    ),
    commandCenter: (
      <>
        <path {...common} d="M24 26h56v34H24z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M34 36h14M34 48h10M58 36h12M58 48h8" stroke={accent} strokeWidth={strokeWidth - 1.2} />
        <path {...common} d="M52 60v12M34 82h36M34 72h36" stroke={stroke} strokeWidth={strokeWidth} />
        <circle cx="34" cy="82" r="4" fill={accent} />
        <circle cx="52" cy="82" r="4" fill={accent} />
        <circle cx="70" cy="82" r="4" fill={accent} />
      </>
    ),
    strategicFramework: (
      <>
        <path {...common} d="M52 16l28 12v26c0 22-14 34-28 40-14-6-28-18-28-40V28z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M38 44h28M38 56h20M38 68h28" stroke={stroke} strokeWidth={strokeWidth - 1.2} />
        <path {...common} d="M68 41l8 8 13-17" stroke={accent} strokeWidth={strokeWidth} />
        <circle cx="34" cy="44" r="2.8" fill={accent} />
        <circle cx="34" cy="56" r="2.8" fill={accent} />
        <circle cx="34" cy="68" r="2.8" fill={accent} />
      </>
    ),
    continuityShield: (
      <>
        <path {...common} d="M52 16l28 12v26c0 22-14 34-28 40-14-6-28-18-28-40V28z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M38 66h28M40 56h24M44 46h16" stroke={accent} strokeWidth={strokeWidth} />
        <path {...common} d="M38 76c8 4 20 4 28 0" stroke={stroke} strokeWidth={strokeWidth - 1} />
        <path {...common} d="M36 38c10-7 22-7 32 0" stroke={muted} strokeWidth={strokeWidth - 1.5} />
      </>
    ),
    crisisComm: (
      <>
        <path {...common} d="M22 44h13l21-12v40L35 60H22z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M35 60v14l12-6" stroke={accent} strokeWidth={strokeWidth - 1} />
        <path {...common} d="M67 42c5 5 5 15 0 20M76 34c10 10 10 27 0 37" stroke={accent} strokeWidth={strokeWidth - 1.2} />
        <path {...common} d="M29 50h10" stroke={muted} strokeWidth={strokeWidth - 1.5} />
      </>
    ),
    decisionPressure: (
      <>
        <circle cx="52" cy="36" r="20" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M52 36l10-10M52 36v12" stroke={accent} strokeWidth={strokeWidth} />
        <path {...common} d="M32 76h40M38 64h28M44 52h16" stroke={stroke} strokeWidth={strokeWidth - 1} />
        <path {...common} d="M74 72l9 9M83 72l-9 9" stroke={accent} strokeWidth={strokeWidth - 0.8} />
      </>
    ),
    proactiveScan: (
      <>
        <circle cx="46" cy="48" r="20" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M61 63l19 19" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M34 48h24M46 36v24" stroke={muted} strokeWidth={strokeWidth - 1.5} />
        <path {...common} d="M68 24c7 3 12 8 15 15M72 14c11 5 19 13 24 24" stroke={accent} strokeWidth={strokeWidth - 1.4} />
      </>
    ),
    riskGrid: (
      <>
        <path {...common} d="M24 24h56v56H24zM52 24v56M24 52h56" stroke={stroke} strokeWidth={strokeWidth} />
        <rect x="54" y="26" width="24" height="24" rx="4" fill={accent} opacity="0.32" />
        <rect x="26" y="54" width="24" height="24" rx="4" fill={accent} opacity="0.18" />
        <path {...common} d="M61 66l6 6 12-16" stroke={accent} strokeWidth={strokeWidth - 0.5} />
      </>
    ),
    earlyWarning: (
      <>
        <path {...common} d="M52 24c-10 0-16 9-16 21v9l-7 11h46l-7-11v-9c0-12-6-21-16-21z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M42 65h20" stroke={accent} strokeWidth={strokeWidth - 1} />
        <circle cx="52" cy="78" r="4.4" fill={accent} />
        <path {...common} d="M76 33c5-5 5-13 0-18M28 33c-5-5-5-13 0-18" stroke={accent} strokeWidth={strokeWidth - 1.5} />
      </>
    ),
    supplyChain: (
      <>
        <path {...common} d="M18 58h32V38H18z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M50 46h15l10 12v10H50z" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M24 46h18M56 56h12" stroke={accent} strokeWidth={strokeWidth - 1.2} />
        <circle cx="30" cy="72" r="6" fill="none" stroke={accent} strokeWidth={strokeWidth - 1} />
        <circle cx="66" cy="72" r="6" fill="none" stroke={accent} strokeWidth={strokeWidth - 1} />
        <path {...common} d="M36 72h24" stroke={muted} strokeWidth={strokeWidth - 1.5} />
      </>
    ),
    afterAction: (
      <>
        <path {...common} d="M32 26h34l8 8v50H32zM66 26v10h10" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M42 20h16v9H42z" stroke={accent} strokeWidth={strokeWidth - 1.5} />
        <path {...common} d="M40 46h22M40 56h18M40 66h12" stroke={muted} strokeWidth={strokeWidth - 1.5} />
        <circle cx="72" cy="68" r="10" fill="none" stroke={accent} strokeWidth={strokeWidth - 1} />
        <path {...common} d="M68 68l3 3 7-8M79 76l7 7" stroke={accent} strokeWidth={strokeWidth - 1} />
      </>
    ),
    kpiDashboard: (
      <>
        <path {...common} d="M22 80h60M30 80V56M48 80V42M66 80V62" stroke={stroke} strokeWidth={strokeWidth} />
        <path {...common} d="M24 38l12-9 12 7 16-15" stroke={accent} strokeWidth={strokeWidth - 1} />
        <circle cx="80" cy="42" r="13" fill="none" stroke={accent} strokeWidth={strokeWidth - 1} />
        <path {...common} d="M80 42l8-8" stroke={stroke} strokeWidth={strokeWidth - 1.5} />
      </>
    ),
    stakeholderNetwork: (
      <>
        <path {...common} d="M52 42V28M52 62v14M42 52H28M62 52h14M40 40L30 30M64 40l10-10M40 64L30 74M64 64l10 10" stroke={muted} strokeWidth={strokeWidth - 1.6} />
        <circle cx="52" cy="52" r="11" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
        <circle cx="52" cy="24" r="6" fill={accent} />
        <circle cx="52" cy="80" r="6" fill={accent} />
        <circle cx="24" cy="52" r="6" fill={accent} />
        <circle cx="80" cy="52" r="6" fill={accent} />
        <circle cx="30" cy="30" r="5" fill={stroke} opacity="0.92" />
        <circle cx="74" cy="30" r="5" fill={stroke} opacity="0.92" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 104 104" className={`h-full w-full ${activeVisualClass(active, kind)}`} aria-hidden="true">
      <circle cx="52" cy="52" r="47" fill={active ? 'rgb(213 238 225 / 0.12)' : 'rgb(226 242 234 / 0.72)'} />
      <circle cx="52" cy="52" r="43" fill="none" stroke={muted} strokeWidth="3" strokeDasharray="8 10" />
      <g className={active ? 'course-glyph-motion' : undefined}>{paths[kind]}</g>
    </svg>
  );
}

/** Picks one of several equally-valid images for the same matched theme,
 *  hashed from the card's own (always-distinct) text, so a keyword rule
 *  that matches dozens of different cards doesn't show the exact same
 *  illustration on all of them once it has more than one variant. */
function variantOf(paths: string[], text: string): string {
  const uniquePaths = [...new Set(paths)];
  return uniquePaths[stableIconIndex(text) % uniquePaths.length];
}

function uniqueVisualCandidates(paths: Array<string | null | undefined>) {
  return paths.filter((src, index): src is string => Boolean(src) && paths.indexOf(src) === index);
}

function pptGeneratedVisualLayersFor(text: string, fallback?: string) {
  const layers: string[] = [];
  const add = (src: string) => {
    if (!layers.includes(src)) layers.push(src);
  };

  // Named frameworks with their own dedicated illustration — checked FIRST,
  // before the broader bag-2 rules below, because these are narrow, precise
  // phrase matches (a card literally about "دورة PDCA" or the "أحمر/أسود"
  // escalation levels) that should win even when the same card's fuller
  // text also happens to mention a broader term like "قيادة" or "خطة
  // تحسين" -- checking broad rules first let them steal the primary slot
  // from a much more specific, more expressive match every time the two
  // overlapped. See docs/bag2-visual-library-expansion-prompt.md for the
  // audit that surfaced these gaps.
  if (hasAny(text, ['معايير التصعيد', 'تسلسل تصعيد', 'أخضر', 'أصفر', 'أحمر', 'أسود', 'برتقالي', 'ربط العتبات بالإجراءات'])) {
    add(variantOf(['/assets/visual-library/emergency-escalation-levels.webp', '/assets/visual-library/emergency-escalation-levels.webp'], text));
  }
  if (hasAny(text, ['OODA', 'Observe لاحظ', 'Orient توجّه', 'Decide قرّر', 'Act نفّذ'])) {
    add(variantOf(['/assets/visual-library/emergency-ooda-loop.webp', '/assets/visual-library/emergency-ooda-loop.webp'], text));
  }
  if (hasAny(text, ['CERC', 'ما قبل الأزمة', 'المرحلة الأولية', 'مرحلة الصيانة', 'مرحلة الحل', 'مرحلة التقييم'])) {
    add(variantOf(['/assets/visual-library/emergency-cerc-timeline.webp', '/assets/visual-library/emergency-cerc-timeline.webp'], text));
  }
  if (hasAny(text, ['PESTLE', 'المسح الأفقي', 'السياسة والتشريع', 'القطاع الخاص'])) {
    add(variantOf(['/assets/visual-library/emergency-pestle-wheel.webp', '/assets/visual-library/emergency-pestle-wheel.webp'], text));
  }
  if (hasAny(text, ['المسح الرأسي', 'المستوى الكلي', 'Macro', 'المستوى المتوسط', 'Meso', 'المستوى الجزئي', 'Micro'])) {
    add(variantOf(['/assets/visual-library/emergency-macro-meso-micro.webp', '/assets/visual-library/emergency-macro-meso-micro.webp'], text));
  }
  if (hasAny(text, ['دلفي', 'مسح الخبراء'])) {
    add(variantOf(['/assets/visual-library/emergency-delphi-method.webp', '/assets/visual-library/emergency-delphi-method.webp'], text));
  }
  if (hasAny(text, ['عجلة المستقبل', 'تحليل التأثير المتبادل'])) {
    add(variantOf(['/assets/visual-library/emergency-futures-wheel.webp', '/assets/visual-library/emergency-futures-wheel.webp'], text));
  }
  if (hasAny(text, ['الخطر Hazard', 'التعرض Exposure', 'الهشاشة Vulnerability', 'أخطار متتالية', 'أخطار متزامنة', 'أخطار متزايدة', 'متعددة الأخطار'])) {
    add(variantOf(['/assets/visual-library/emergency-hazard-triangle.webp', '/assets/visual-library/emergency-hazard-triangle.webp'], text));
  }
  if (hasAny(text, ['مصفوفة السيناريوهات', 'حالات عدم اليقين', 'القوى الدافعة', 'الروايات', 'سؤال محوري'])) {
    add(variantOf(['/assets/visual-library/emergency-scenario-matrix.webp', '/assets/visual-library/emergency-scenario-matrix.webp'], text));
  }
  if (hasAny(text, ['مؤشرات استباقية', 'Leading', 'مؤشرات متأخرة', 'Lagging', 'مؤشرات كمية', 'Quantitative', 'مؤشرات نوعية', 'Qualitative'])) {
    add(variantOf(['/assets/visual-library/emergency-leading-lagging.webp', '/assets/visual-library/emergency-leading-lagging.webp'], text));
  }
  if (hasAny(text, ['الترصد القائم على المؤشرات', 'الترصد القائم على الأحداث'])) {
    add(variantOf(['/assets/visual-library/emergency-surveillance-modes.webp', '/assets/visual-library/emergency-surveillance-modes.webp'], text));
  }
  if (hasAny(text, ['الفئة A', 'الفئة B', 'الفئة C', 'ABC'])) {
    add(variantOf(['/assets/visual-library/emergency-abc-inventory.webp', '/assets/visual-library/emergency-abc-inventory.webp'], text));
  }
  if (hasAny(text, ['PDCA', 'دورة PDCA'])) {
    add(variantOf(['/assets/visual-library/emergency-pdca-cycle.webp', '/assets/visual-library/emergency-pdca-cycle.webp'], text));
  }
  if (hasAny(text, ['القوة والاهتمام', 'راقب', 'أبقهم مطلعين', 'أبقهم راضين', 'أدرهم عن كثب'])) {
    add(variantOf(['/assets/visual-library/emergency-power-interest-matrix.webp', '/assets/visual-library/emergency-power-interest-matrix.webp'], text));
  }
  if (hasAny(text, ['كن الأول', 'كن دقيقًا', 'كن ذا مصداقية', 'عبّر عن التعاطف', 'شجّع على العمل', 'أظهر الاحترام'])) {
    add(variantOf(['/assets/visual-library/emergency-crisis-comm-principles.webp', '/assets/visual-library/emergency-crisis-comm-principles.webp'], text));
  }
  if (hasAny(text, ['معايير SMART', 'SMART', 'SMART-ER'])) {
    add(variantOf(['/assets/visual-library/emergency-smart-criteria.webp', '/assets/visual-library/emergency-smart-criteria.webp'], text));
  }
  if (hasAny(text, ['السيناريو الأفضل', 'السيناريو الأسوأ', 'السيناريو الأكثر ترجيحًا'])) {
    add(variantOf(['/assets/visual-library/emergency-scenario-branches.webp', '/assets/visual-library/emergency-scenario-branches.webp'], text));
  }

  // Bag 2 (emergency response) broader topics — checked after the precise
  // rules above so their own visuals win the primary card slot even when a
  // word also appears in bag 1's governance vocabulary (e.g. "مخاطر",
  // "قيادة", "تقييم").
  if (hasAny(text, ['مصفوفة RACI', 'RACI', 'المسؤول عن التنفيذ', 'المساءَل', 'يجب استشارته', 'يجب إعلامه'])) {
    add(variantOf(['/assets/visual-library/emergency-raci-matrix.webp', '/assets/visual-library/emergency-raci-matrix.webp', '/assets/visual-library/emergency-raci-matrix.webp'], text));
  }
  if (hasAny(text, ['ديناميكيات الأزمات', 'أنواع الأزمات', 'الحدث Event', 'الطارئ Emergency', 'الأزمة Crisis', 'الكارثة Disaster'])) {
    add('/assets/visual-library/emergency-crisis-terms.webp');
  }
  if (hasAny(text, ['القيادة أثناء الأزمات', 'سمات القيادة', 'الهدوء الظاهر', 'الحسم في القرارات', 'التعاطف الإنساني', 'التواجد الميداني'])) {
    add(variantOf(['/assets/visual-library/emergency-leadership-traits.webp', '/assets/visual-library/emergency-leadership-traits.webp', '/assets/visual-library/emergency-leadership-traits.webp'], text));
  }
  if (hasAny(text, ['ICS', 'EOC', 'قائد الحادث', 'مركز عمليات الطوارئ', 'مركز القيادة', 'مركز قيادة', 'التنسيق أثناء الطوارئ'])) {
    add(variantOf(['/assets/visual-library/emergency-command-center.webp', '/assets/visual-library/emergency-command-center.webp', '/assets/visual-library/emergency-command-center.webp'], text));
  }
  if (hasAny(text, ['الإطار الاستراتيجي', 'الاستعداد للطوارئ', 'خطط الطوارئ', 'الجاهزية المؤسسية', 'التكامل بين الجهات', 'السياسات التشغيلية', 'تفعيل السياسات'])) {
    add('/assets/visual-library/emergency-strategic-framework.webp');
  }
  if (hasAny(text, ['استمرارية الأعمال', 'التعافي', 'الموارد الحيوية', 'العمليات الحرجة'])) {
    add(variantOf(['/assets/visual-library/emergency-continuity-shield.webp', '/assets/visual-library/emergency-continuity-shield.webp', '/assets/visual-library/emergency-continuity-shield.webp'], text));
  }
  if (
    hasAny(text, [
      'التواصل',
      'الإعلام',
      'الثقة المجتمعية',
      'الرسائل الإعلامية',
      'المتحدث',
      'بناء الثقة',
      'الدروس المستفادة للمملكة',
    ])
  ) {
    add(variantOf(['/assets/visual-library/emergency-crisis-communication.webp', '/assets/visual-library/emergency-crisis-communication.webp', '/assets/visual-library/emergency-crisis-communication.webp'], text));
  }
  if (hasAny(text, ['اتخاذ القرار', 'شلل التحليل', 'تحت الضغط'])) {
    add(variantOf(['/assets/visual-library/emergency-decision-pressure.webp', '/assets/visual-library/emergency-decision-pressure.webp', '/assets/visual-library/emergency-decision-pressure.webp'], text));
  }
  if (hasAny(text, ['المسح الاستباقي', 'استشراف', 'التخطيط بالسيناريوهات'])) {
    add('/assets/visual-library/emergency-proactive-scanning.webp');
  }
  if (hasAny(text, ['خريطة المخاطر', 'خرائط المخاطر', 'مصفوفة تفاعل الأخطار'])) {
    add(variantOf(['/assets/visual-library/emergency-risk-matrix.webp', '/assets/visual-library/emergency-risk-matrix.webp', '/assets/visual-library/emergency-risk-matrix.webp'], text));
  }
  if (hasAny(text, ['الترصد', 'الإنذار المبكر', 'حصن', 'مستويات العتبة'])) {
    add(variantOf(['/assets/visual-library/emergency-surveillance-radar.webp', '/assets/visual-library/emergency-surveillance-radar.webp', '/assets/visual-library/emergency-surveillance-radar.webp'], text));
  }
  if (hasAny(text, ['سلسلة التوريد', 'اللوجستيات', 'اللوجستية', 'المخزون', 'نوبكو', 'EOQ', 'الموردين', 'مرونة سلسلة'])) {
    add(variantOf(['/assets/visual-library/emergency-supply-chain.webp', '/assets/visual-library/emergency-supply-chain.webp', '/assets/visual-library/emergency-supply-chain.webp'], text));
  }
  if (hasAny(text, ['مراجعة ما بعد الحدث', 'AAR', 'الدروس المستفادة', 'خطة التحسين', 'خطة تحسين'])) {
    add(variantOf(['/assets/visual-library/emergency-after-action-review.webp', '/assets/visual-library/emergency-after-action-review.webp', '/assets/visual-library/emergency-after-action-review.webp'], text));
  }
  if (hasAny(text, ['مؤشرات الأداء', 'مؤشرات الجاهزية', 'مؤشرات الاستجابة', 'مؤشرات النتائج', 'مؤشرات التحسين', 'KPI', 'لوحة معلومات', 'Dashboard', 'خط الأساس'])) {
    add(variantOf(['/assets/visual-library/emergency-kpi-dashboard.webp', '/assets/visual-library/emergency-kpi-dashboard.webp', '/assets/visual-library/emergency-kpi-dashboard.webp'], text));
  }
  if (hasAny(text, ['أصحاب المصلحة', 'Stakeholders'])) {
    add(variantOf(['/assets/visual-library/emergency-stakeholder-network.webp', '/assets/visual-library/emergency-stakeholder-network.webp', '/assets/visual-library/emergency-stakeholder-network.webp'], text));
  }
  if (hasAny(text, ['الموارد البشرية', 'تنسيق الموارد', 'تنسيق المعلومات', 'تدفق المعلومات', 'فرق الاستجابة', 'الكوادر'])) {
    add(variantOf(['/assets/visual-library/emergency-response-team.webp', '/assets/visual-library/emergency-response-team.webp', '/assets/visual-library/emergency-response-team.webp'], text));
  }

  // Bag 1's generic vocabulary (خطر/قيادة/إطار/تقييم...) overlaps heavily
  // with emergency-management language ("مركز قيادة", "تقييم المخاطر
  // متعددة الأخطار"...), so once the text is clearly emergency-topic (and
  // none of bag 2's own precise-phrase rules above already matched), skip
  // these generic rules entirely instead of letting an incidental word like
  // "قيادة" hijack the card into bag 1's governance imagery.
  const isEmergencyTopic = layers.length > 0 || hasAny(text, ['طوارئ', 'أزمة', 'أزمات', 'كارثة', 'حادث', 'الاستجابة', '__bag2__']);

  if (!isEmergencyTopic) {
    if (hasAny(text, ['مخاطر', 'الخطر', 'Risk', 'أيزو 31000', '31000', 'معالجة', 'مراقبة', 'تقييم'])) {
      add('/assets/visual-library/risk-scene.webp');
      add('/assets/visual-library/risk-matrix.webp');
    }
    if (hasAny(text, ['امتثال', 'ضوابط', 'تدقيق', 'اختبار', 'متطلبات', 'اعتماد', 'جودة', 'KPI', 'KPIs'])) {
      add('/assets/visual-library/compliance-scene.webp');
      add('/assets/visual-library/audit-controls.webp');
    }
    if (hasAny(text, ['بيانات', 'سجلات', 'خصوصية', 'الوصول', 'حماية', 'مرضى', 'مريض'])) {
      add('/assets/visual-library/secure-records.webp');
    }
    if (hasAny(text, ['سياسة', 'سياسات', 'إجراء', 'إجراءات', 'لوائح', 'وثيقة', 'توعية', 'تطبيق عملي', 'تفسير'])) {
      add('/assets/visual-library/policy-scene.webp');
      add('/assets/visual-library/policy-workflow.webp');
    }
    if (hasAny(text, ['حوكمة', 'مجلس', 'لجان', 'قيادة', 'إطار', 'تنظيمية', 'رؤية 2030', 'مستويات'])) {
      add('/assets/visual-library/governance-scene.webp');
      add('/assets/visual-library/leadership-board.webp');
    }
  }

  if (layers.length === 0) {
    if (fallback) {
      add(fallback);
    } else if (isEmergencyTopic) {
      // Most card titles are short, specific phrases ("توزيع الأدوار",
      // "قنوات اتصال معتمدة"...) that never trip any of bag 2's keyword
      // rules above, so they all used to fall through to this one fixed
      // image -- across Chapter 1 that meant the exact same illustration
      // on the majority of cards. Hashing the card's own (always-distinct)
      // text into the combined illustration + shared-icon pool instead
      // gives every untitled card its own consistent-but-varied visual.
      add(EMERGENCY_FALLBACK_POOL[stableIconIndex(text) % EMERGENCY_FALLBACK_POOL.length]);
    } else {
      add('/assets/visual-library/governance-scene.webp');
    }
  }
  if (layers.length === 1) {
    if (layers[0].includes('emergency-command')) add('/assets/visual-library/emergency-strategic-framework.webp');
    else if (layers[0].includes('emergency')) add('/assets/visual-library/emergency-command-center.webp');
    else if (layers[0].includes('risk')) add('/assets/visual-library/risk-matrix.webp');
    else if (layers[0].includes('policy')) add('/assets/visual-library/policy-workflow.webp');
    else if (layers[0].includes('compliance')) add('/assets/visual-library/audit-controls.webp');
    else add('/assets/visual-library/leadership-board.webp');
  }
  return layers.slice(0, 3);
}

const SHARED_BRAND_ICON_POOL = [...new Set([
  '/assets/visual-library/icon-shield-check.webp',
  '/assets/visual-library/icon-institution-board.webp',
  '/assets/visual-library/icon-target-alignment.webp',
  '/assets/visual-library/icon-announcement-speaker.webp',
  '/assets/visual-library/icon-performance-chart.webp',
  '/assets/visual-library/icon-control-grid.webp',
  '/assets/visual-library/icon-alert-bell.webp',
  '/assets/visual-library/icon-network-nodes.webp',
  '/assets/visual-library/icon-response-vehicle.webp',
  '/assets/visual-library/icon-policy-document.webp',
  '/assets/visual-library/icon-strategy-cube.webp',
  '/assets/visual-library/icon-kpi-dashboard.webp',
  '/assets/visual-library/icon-file-report.webp',
  '/assets/visual-library/icon-ethics-balance.webp',
  '/assets/visual-library/icon-direction-sign.webp',
  '/assets/visual-library/icon-discussion-bubble.webp',
  '/assets/visual-library/icon-shield-check.webp',
  '/assets/visual-library/icon-checklist-action.webp',
  '/assets/visual-library/icon-institution-board.webp',
  '/assets/visual-library/icon-target-alignment.webp',
  '/assets/visual-library/icon-control-grid.webp',
  '/assets/visual-library/icon-alert-bell.webp',
  '/assets/visual-library/icon-network-nodes.webp',
  '/assets/visual-library/icon-response-vehicle.webp',
  '/assets/visual-library/icon-policy-document.webp',
  '/assets/visual-library/icon-search-plus.webp',
  '/assets/visual-library/icon-strategy-cube.webp',
  '/assets/visual-library/icon-kpi-dashboard.webp',
  '/assets/visual-library/icon-file-report.webp',
  '/assets/visual-library/icon-direction-sign.webp',
  '/assets/visual-library/icon-discussion-bubble.webp',
  '/assets/visual-library/icon-shield-check.webp',
  '/assets/visual-library/icon-institution-board.webp',
  '/assets/visual-library/icon-target-alignment.webp',
  '/assets/visual-library/icon-announcement-speaker.webp',
  '/assets/visual-library/icon-performance-chart.webp',
  '/assets/visual-library/icon-control-grid.webp',
  '/assets/visual-library/icon-alert-bell.webp',
  '/assets/visual-library/icon-network-nodes.webp',
  '/assets/visual-library/icon-policy-document.webp',
  '/assets/visual-library/icon-search-plus.webp',
  '/assets/visual-library/icon-strategy-cube.webp',
  '/assets/visual-library/icon-kpi-dashboard.webp',
  '/assets/visual-library/icon-direction-sign.webp',
  '/assets/visual-library/icon-discussion-bubble.webp',
  '/assets/visual-library/icon-shield-check.webp',
  '/assets/visual-library/icon-checklist-action.webp',
  '/assets/visual-library/icon-institution-board.webp',
  '/assets/visual-library/icon-target-alignment.webp',
  '/assets/visual-library/icon-announcement-speaker.webp',
  '/assets/visual-library/icon-performance-chart.webp',
  '/assets/visual-library/icon-control-grid.webp',
  '/assets/visual-library/icon-alert-bell.webp',
  '/assets/visual-library/icon-policy-document.webp',
  '/assets/visual-library/icon-strategy-cube.webp',
  '/assets/visual-library/icon-kpi-dashboard.webp',
  '/assets/visual-library/icon-file-report.webp',
  '/assets/visual-library/icon-ethics-balance.webp',
  '/assets/visual-library/icon-direction-sign.webp',
])];

function stableIconIndex(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}

// Every emergency-topic illustration plus the full shared icon library, for
// cards whose title doesn't trip any of pptGeneratedVisualLayersFor's
// specific keyword rules -- see its use there.
// Deliberately generic icons only -- NOT the specific illustrations above.
// A card that matched none of the specific keyword rules has no real
// connection to any of those illustrations, so showing e.g. the PESTLE
// wheel or the surveillance radar on an unrelated card would look like a
// confident (but wrong) claim about that card's content. A neutral shared
// icon doesn't make that claim, while still giving every unmatched card
// its own distinct, varied visual (see sharedBrandIconFor below).
const EMERGENCY_FALLBACK_POOL = SHARED_BRAND_ICON_POOL;

// This is the per-card badge every matrix/spotlight/timeline card actually
// shows -- despite pptGeneratedVisualLayersFor's ~40 keyword rules being
// able to match a card to a real, specific illustration (PDCA cycle, RACI
// matrix, supply chain...), this function used to skip that matching
// entirely and always return a hash-picked *generic* icon (shield-check,
// target-alignment...), so even a card that would have matched a precise
// illustration never actually got to show it. Try the real match first
// (forcing bag-2 routing via the __bag2__ marker so a short card title like
// "قيادة واحدة" doesn't fall through to bag-1's governance imagery), and
// only fall back to the generic hash pool when nothing specific matched.
//
// Only the *primary* layer counts, and only when it's a genuine bag-2
// illustration (`/emergency-*`) -- pptGeneratedVisualLayersFor's own
// companion-layer step (see "if (layers.length === 1)" there) tacks on a
// second, bag-1-flavored image whenever the primary slot is a generic
// icon, which would otherwise leak governance imagery like
// leadership-board.webp onto confirmed emergency cards.
// `usedIcons`, when passed, is a per-scene Set shared across every card in
// the SAME shot -- without it, every card whose content matches the same
// pptGeneratedVisualLayersFor keyword rule (very common: several cards in
// one act are often variations on the same topic) got back the exact same
// primary illustration, so a single shot could show 3-4 identical images
// side by side. With it, a repeat falls through to the next untaken icon in
// this card's own hash-ordered candidate list instead, so every card in a
// shot gets something visually distinct.
function sharedBrandIconFor(text: string, index = 0, usedIcons?: Set<string>, avoidIcons?: Set<string>) {
  const primary = pptGeneratedVisualLayersFor(`${text} __bag2__`)[0];
  const candidates: string[] = [];
  if (primary?.includes('/emergency-')) candidates.push(primary);
  const seed = stableIconIndex(text);
  for (let k = 0; k < SHARED_BRAND_ICON_POOL.length; k += 1) {
    candidates.push(SHARED_BRAND_ICON_POOL[(seed + index * 7 + k) % SHARED_BRAND_ICON_POOL.length]);
  }
  const uniqueCandidates = uniqueVisualCandidates(candidates);
  if (!usedIcons) return uniqueCandidates[0];
  const pick =
    uniqueCandidates.find((c) => !usedIcons.has(c) && !avoidIcons?.has(c)) ??
    uniqueCandidates.find((c) => !usedIcons.has(c)) ??
    uniqueCandidates[0];
  usedIcons.add(pick);
  return pick;
}

function PptTitle({ slide, showVisual = true }: { slide: Slide; showVisual?: boolean }) {
  const displayTitle = slide.ppt?.unitTitle ?? slide.title;
  const glyphKind = courseGlyphKind(`${displayTitle} ${slide.ppt?.subtitle ?? ''} ${slide.ppt?.courseName ?? ''}`);
  const isEmergencySlide = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  const brandIcon = showVisual && isEmergencySlide ? sharedBrandIconFor(`${displayTitle} ${slide.narration}`, slide.index) : null;
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
      <h2 className={`inline-flex items-center justify-center text-[36px] font-extrabold leading-tight text-brand-strong ${showVisual ? 'gap-3' : ''}`}>
        {showVisual && (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-green-700/16 bg-white/80 p-1.5 shadow-sm">
            {brandIcon ? (
              <BrandIcon src={brandIcon} tone="primary" className="h-full w-full drop-shadow-[0_8px_10px_rgb(24_82_55_/_0.12)]" />
            ) : (
              <CourseGlyph kind={glyphKind} compact />
            )}
          </span>
        )}
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
  locked = false,
  emergencyHint = false,
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
  locked?: boolean;
  /** True for bag-2 cards, so a card whose own text has no strong keyword
   *  still falls back to an emergency-themed visual instead of bag 1's. */
  emergencyHint?: boolean;
}) {
  void emoji;
  const tone = card.tone ?? 'green';
  const clickable = Boolean(onClick) && !locked;
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
  const padClass = level === 'micro' ? 'px-3 py-1.5' : level === 'compact' ? 'p-3' : level === 'loose' ? 'p-5' : 'p-4';
  const titleClass =
    level === 'micro'
      ? 'text-[14.5px] leading-[1.12]'
      : level === 'compact'
        ? 'text-[17.5px] leading-snug'
        : level === 'loose'
          ? 'text-[23px] leading-tight'
          : 'text-[21px] leading-tight';
  const bulletClass = level === 'micro' ? 'text-[10.8px] leading-[1.12]' : level === 'compact' ? 'text-[14px] leading-[1.22]' : 'text-[17px] leading-snug';
  const indexSize = level === 'micro' ? 'h-7 w-7 text-[12px]' : 'h-8 w-8 text-[14px]';
  const visualSize =
    emergencyHint
      ? level === 'micro'
        ? 'h-[92px] w-[152px] p-1'
        : level === 'compact'
          ? 'h-[134px] w-[210px] p-1.5'
          : level === 'loose'
            ? 'h-[196px] w-[292px] p-2'
            : 'h-[162px] w-[248px] p-2'
      : level === 'micro'
        ? 'h-[58px] w-[108px] p-1'
        : level === 'compact'
          ? 'h-[92px] w-[158px] p-1.5'
          : level === 'loose'
            ? 'h-[148px] w-[228px] p-2'
            : 'h-[118px] w-[188px] p-2';
  const ghostVisualSize =
    level === 'micro'
      ? 'h-24 w-24'
      : level === 'compact'
        ? 'h-28 w-28'
        : level === 'loose'
          ? 'h-48 w-48'
          : 'h-36 w-36';
  const glyphKind = courseGlyphKind(`${card.title} ${card.text ?? ''} ${card.bullets?.join(' ') ?? ''} ${card.answer ?? ''}`);
  const passiveShell =
    tone === 'gold' ? 'border-gold-500/18 bg-gold-50/90' : 'border-green-700/14 bg-green-50/90';
  const activeShell = active
    ? 'scale-[1.025] border-gold-500/45 bg-green-700 text-white shadow-card-lg'
    : passiveShell;
  const titleTone = active ? 'text-white' : 'text-brand-strong';
  const bodyTone = active ? 'text-green-50' : 'text-ink';
  const tileTone = active
    ? 'border-white/35 bg-white/16 text-white shadow-card'
    : tone === 'gold'
      ? 'border-gold-500/22 bg-white/90'
      : 'border-green-700/14 bg-white/90';
  const accentTone = active ? 'bg-gold-300' : tone === 'gold' ? 'bg-gold-500' : 'bg-green-700';
  const showAnswerDetail = reveal && Boolean(card.answer);
  const showTrainingDetail = reveal && Boolean(detail) && !card.answer;
  const visualLayers = pptGeneratedVisualLayersFor(`${card.title} ${card.text ?? ''} ${card.bullets?.join(' ') ?? ''}${emergencyHint ? ' __bag2__' : ''}`);
  const brandIcon = emergencyHint ? sharedBrandIconFor(`${card.title} ${card.text ?? ''} ${card.bullets?.join(' ') ?? ''}`, Number(card.index ?? 0)) : null;

  return (
    <button
      type="button"
      disabled={!clickable || !visible}
      onClick={onClick}
      data-ppt-card="true"
      aria-hidden={!visible}
      aria-label={clickable ? `${card.title} - ${showTrainingDetail ? 'العودة للنص الأساسي' : 'عرض التفصيل'}` : card.title}
      className={`relative flex h-full w-full max-h-full min-h-0 flex-col self-center overflow-visible border text-center shadow-[0_18px_42px_rgb(24_82_55_/_0.10)] backdrop-blur-sm [border-radius:44px_26px_42px_24px] transition-all duration-500 ease-out ${
        activeShell
      } ${visible ? revealAnimation : 'pointer-events-none opacity-0'} ${
        clickable && visible ? 'cursor-pointer hover:-translate-y-1 hover:shadow-card-lg animate-pulse-ring' : 'cursor-default'
      } ${locked && visible ? '!bg-white !border-line' : ''}`}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgb(255_255_255_/_0.48),transparent_28%),radial-gradient(circle_at_18%_82%,rgb(197_162_80_/_0.16),transparent_34%)]"
        aria-hidden="true"
      />
      {active && <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_42%_22%,rgb(255_255_255_/_0.24),transparent_38%)]" />}
      <span
        className={`pointer-events-none absolute -left-10 -bottom-8 ${ghostVisualSize} rotate-[-10deg] opacity-[0.075] transition-opacity duration-500 ${
          active ? 'opacity-[0.18]' : ''
        }`}
        aria-hidden="true"
      >
        {brandIcon ? (
          <BrandIcon src={brandIcon} tone={active ? 'white' : 'primary'} className={`h-full w-full ${activeVisualClass(active, `${card.title} ${card.text ?? ''}`, Number(card.index ?? 0))}`} />
        ) : (
          <CourseGlyph kind={glyphKind} active={active} />
        )}
      </span>
      <span
        className={`pointer-events-none absolute right-5 top-5 h-3 w-14 rounded-full ${accentTone} opacity-80`}
        aria-hidden="true"
      />
      <div className={`${padClass} relative z-10 flex min-h-0 flex-col items-center justify-center`}>
        <div className={`${level === 'micro' ? 'mb-1 gap-1' : 'mb-2.5 gap-2'} relative flex w-full flex-col items-center`}>
          <span className={`relative grid ${visualSize} shrink-0 place-items-center border ${tileTone} shadow-[0_18px_34px_rgb(24_82_55_/_0.14)] [border-radius:30px_18px_28px_18px]`}>
            <span className="pointer-events-none absolute -left-1.5 -top-1.5 h-6 w-6 rounded-full border border-white/80 bg-gold-400/85 shadow-sm" aria-hidden="true" />
            {brandIcon && (
              <span className="pointer-events-none absolute right-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-2xl border border-white/75 bg-white/88 p-1.5 shadow-sm" aria-hidden="true">
                <BrandIcon src={brandIcon} tone="primary" className={`h-full w-full ${activeVisualClass(active, `${card.title} ${card.text ?? ''}`, Number(card.index ?? 0))}`} />
              </span>
            )}
            {visualLayers[0] && (
              <img
                src={visualLayers[0]}
                alt=""
                className={`absolute inset-0 h-full w-full object-contain drop-shadow-[0_14px_18px_rgb(24_82_55_/_0.16)] ${active ? activeVisualAnimationFor(`${card.title} ${card.text ?? ''}`, Number(card.index ?? 0)) : 'animate-float'}`}
                loading="lazy"
                decoding="async"
                aria-hidden="true"
              />
            )}
          </span>
          {card.index && (
            <span className={`absolute right-3 top-1 grid ${indexSize} shrink-0 place-items-center rounded-full font-extrabold tabular ${active ? 'bg-white/20 text-white ring-2 ring-white/25' : 'bg-green-700 text-white shadow-sm'}`}>
              {card.index}
            </span>
          )}
          <h3 className={`${showAnswerDetail ? 'text-[18px] leading-tight' : titleClass} max-w-full font-extrabold ${titleTone}`}>
            {showAnswerDetail ? `الإجابة: ${card.answer}` : card.title}
          </h3>
        </div>

        {showAnswerDetail ? (
          <div className={`mt-1 rounded-2xl border p-2 ${active ? 'border-white/25 bg-white/15' : 'border-green-700/20 bg-white/54'}`}>
            <p className={`${level === 'micro' ? 'text-[13px]' : 'text-[14px]'} font-bold leading-snug ${bodyTone}`}>
              {card.rationale ?? 'اربط الإجابة بالهدف التدريبي ثم انتقل للنقطة التالية.'}
            </p>
          </div>
        ) : showTrainingDetail ? (
          <div className={`mt-1 rounded-2xl border p-2 ${active ? 'border-white/25 bg-white/15' : 'border-green-700/20 bg-white/54'}`}>
            <p className={`${level === 'micro' ? 'text-[13px]' : 'text-[14px]'} font-bold leading-snug ${bodyTone}`}>
              {detail}
            </p>
          </div>
        ) : null}

        {showTrainingDetail && card.bullets && (
          <ul className={`${level === 'micro' ? 'mt-1 space-y-1' : 'mt-1.5 space-y-1.5'} w-full`}>
            {card.bullets.map((bullet, i) => (
              <li key={i} className={`${bulletClass} flex justify-center gap-2 text-center font-bold ${bodyTone}`}>
                <span className={`${level === 'micro' ? 'mt-1 h-1.5 w-1.5' : 'mt-1.5 h-2 w-2'} shrink-0 rounded-full ${active ? 'bg-gold-300' : 'bg-gold-500'}`} />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {clickable && <span className="sr-only">{showTrainingDetail || showAnswerDetail ? 'العودة' : 'عرض المزيد'}</span>}
      </div>
    </button>
  );
}

/** The pool of best-matching themed illustrations for a slide, shared by
 *  every ppt* layout that shows an image (not just an icon) -- picks up
 *  bag-2 topics first, falls back to a course-aware default pool so a
 *  slide never ends up with no visual at all. First entry is the primary
 *  (best) match. */
function slideVisualPool(slide: Slide, cards: PptCard[]) {
  const isEmergencySlide = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  const fallbackVisualPool = isEmergencySlide
    ? ['/assets/visual-library/emergency-command-center.webp', '/assets/visual-library/emergency-strategic-framework.webp', '/assets/visual-library/emergency-stakeholder-network.webp', '/assets/visual-library/emergency-kpi-dashboard.webp']
    : slide.id.startsWith('ch3')
      ? ['/assets/visual-library/risk-scene.webp', '/assets/visual-library/risk-matrix.webp', '/assets/visual-library/audit-controls.webp', '/assets/visual-library/secure-records.webp']
      : slide.id.startsWith('ch2')
        ? ['/assets/visual-library/compliance-scene.webp', '/assets/visual-library/audit-controls.webp', '/assets/visual-library/policy-workflow.webp', '/assets/visual-library/secure-records.webp']
        : ['/assets/visual-library/governance-scene.webp', '/assets/visual-library/policy-scene.webp', '/assets/visual-library/policy-workflow.webp', '/assets/visual-library/leadership-board.webp'];
  // Marker so a card whose own text has no bag-2 keyword (a bare label
  // like "التخطيط" or "الفئة A") still gets an emergency-themed fallback
  // instead of drifting to bag 1's governance imagery once its per-card
  // matching bottoms out.
  const courseMarker = isEmergencySlide ? ' __bag2__' : '';
  // Slide-title match goes first: it's usually the more specific signal
  // (e.g. a title like "فهم ديناميكيات الأزمات" naming the exact concept),
  // while per-card text is often a bare one-word label that only reaches
  // the generic fallback -- putting cards first would let that generic
  // fallback claim the primary visual slot ahead of the better title match.
  const slideLevelVisuals = pptGeneratedVisualLayersFor(`${slide.title} ${slide.narration.slice(0, 200)}${courseMarker}`);
  const allVisuals = slideLevelVisuals
    .concat(cards.flatMap((card) => pptGeneratedVisualLayersFor(`${card.title} ${card.text ?? ''} ${card.bullets?.join(' ') ?? ''}${courseMarker}`)))
    .filter((src, index, all) => all.indexOf(src) === index)
    .slice(0, 6);
  return allVisuals.length >= Math.min(cards.length, 3) ? allVisuals : fallbackVisualPool;
}

function PptMotionVisualScene({
  slide,
  layout,
  cards,
  activeCard,
  visibleFor,
  revealAnimationFor,
  expandedKey,
  onToggle,
}: {
  slide: Slide;
  /** Effective layout for this act -- defaults to slide.layout, but a
   *  multi-act slide can point a specific act at a different shape via
   *  actLayouts (see PptContent). */
  layout?: PptLayout;
  cards: PptCard[];
  activeCard: number;
  visibleFor: (index: number) => boolean;
  revealAnimationFor: (index: number) => string;
  expandedKey: string | null;
  onToggle: (index: number) => void;
}) {
  const { isPlaying: narrationLocked } = useNarrationContext();
  const effectiveLayout = layout ?? slide.layout;
  const isEmergencySlide = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  // Whichever card is highlighted right now, whether narration drove it
  // there (activeCard) or the learner clicked it open (expandedKey) --
  // used only to know when to re-roll the highlight animation below.
  const effectiveActiveKey = expandedKey ?? (activeCard >= 0 ? `${slide.id}:${activeCard}` : null);
  const [focusAnim, setFocusAnim] = useState(() => pickFocusAnimation());
  const [lastActiveKey, setLastActiveKey] = useState(effectiveActiveKey);
  // Re-rolled synchronously during render (React's documented pattern for
  // "reset/derive state when a prop changes") instead of in a useEffect --
  // an effect only runs after the browser has already painted the old
  // animation, so switching cards would flash the previous motion for a
  // frame before snapping to the new one. Adjusting state mid-render lets
  // React redo the render with the new animation before anything paints,
  // so the new highlight starts immediately with no visible handoff delay.
  if (effectiveActiveKey !== lastActiveKey) {
    setLastActiveKey(effectiveActiveKey);
    if (effectiveActiveKey) setFocusAnim((previous) => pickFocusAnimation(previous));
  }
  // While the SAME card stays active for a while (Nasser talking about it
  // at length), don't let one motion loop forever -- play it two or three
  // times, then swap to a different one from the pool, so the highlight
  // keeps feeling alive instead of a single fixed animation on repeat.
  useEffect(() => {
    if (!effectiveActiveKey) return;
    const duration = FOCUS_ANIMATION_DURATIONS_MS[focusAnim] ?? 2400;
    const repeats = 2 + Math.floor(Math.random() * 2); // 2 or 3 loops
    const timer = window.setTimeout(() => {
      setFocusAnim((previous) => pickFocusAnimation(previous));
    }, duration * repeats);
    return () => window.clearTimeout(timer);
  }, [effectiveActiveKey, focusAnim]);
  const visualPool = slideVisualPool(slide, cards);
  const primaryVisual = visualPool[0] ?? '/assets/visual-library/governance-scene.webp';
  const titleCardGrid = isEmergencySlide && effectiveLayout === 'pptTitleCards';
  const variant = effectiveLayout === 'pptTwoPanels'
    ? 'split'
    : titleCardGrid
      ? 'titleGrid'
    : cards.length >= 5
      ? 'constellation'
      : slide.index % 3 === 0
        ? 'orbit'
        : slide.index % 3 === 1
          ? 'path'
          : 'split';
  // Every variant's default slot array (titleGrid, orbit, path, split,
  // constellation) is a 4-6 slot layout that only fills top-first (or
  // top+bottom split at 4+), so with fewer cards the group sits stranded
  // in whatever corner the first N slots happen to occupy -- centered on
  // neither axis, with the rest of the canvas empty. 1-3 cards always get
  // this single row instead, both horizontally AND vertically centered in
  // the scene, sized larger since there's more room per card. Skipped only
  // for pptTwoPanels's dedicated 2-card splitTwo layout below, which is a
  // deliberate side-by-side "compare" shape already tuned to stay clear of
  // Nasser regardless of which side he's standing on.
  const sparsePositions: Record<number, string[]> = {
    1: ['right-[33%] top-[30%] w-[34%]'],
    2: ['right-[16%] top-[30%] w-[30%]', 'right-[54%] top-[30%] w-[30%]'],
    3: ['right-[6%] top-[30%] w-[26%]', 'right-[37%] top-[30%] w-[26%]', 'right-[68%] top-[30%] w-[26%]'],
  };
  const isSparseGroup = cards.length >= 1 && cards.length <= 3 && !(effectiveLayout === 'pptTwoPanels' && cards.length === 2);
  // pptTitleCards used to split 4-6 cards across a fixed 4-top + 2-bottom
  // grid -- fine at exactly 4 or 6 (both rows full and even), but 5 cards
  // left one lone card by itself in the bottom row: visually unbalanced,
  // and the odd one out ended up looking like it didn't belong ("مش شكله
  // متظبط") -- reported directly against ec1-emergency-plans' 5-element
  // shot. titleCardGrid now always lays every count (1-6) out as a single
  // centered row instead, sizing cards down as the count grows so more of
  // them still fit -- no more asymmetric multi-row split for any count.
  // Values are STATIC string literals, not computed via template
  // interpolation -- Tailwind's build only ever generates CSS for
  // arbitrary-value classes it can find as literal text while scanning the
  // source, so a runtime-built class like `right-[${margin}%]` silently
  // produces no CSS at all and every card collapses to the same spot. Learned
  // this the hard way: an earlier version of this exact block computed the
  // positions dynamically and every card rendered stacked in one corner.
  const titleGridRowPositions: Record<number, string[]> = {
    1: ['right-[33%] top-[30%] w-[34%]'],
    2: ['right-[16%] top-[30%] w-[30%]', 'right-[54%] top-[30%] w-[30%]'],
    3: ['right-[6%] top-[30%] w-[26%]', 'right-[37%] top-[30%] w-[26%]', 'right-[68%] top-[30%] w-[26%]'],
    4: ['right-[2.8%] top-[30%] w-[21%]', 'right-[27.3%] top-[30%] w-[21%]', 'right-[51.8%] top-[30%] w-[21%]', 'right-[76.3%] top-[30%] w-[21%]'],
    5: ['right-[1.3%] top-[30%] w-[17.5%]', 'right-[21.3%] top-[30%] w-[17.5%]', 'right-[41.3%] top-[30%] w-[17.5%]', 'right-[61.3%] top-[30%] w-[17.5%]', 'right-[81.3%] top-[30%] w-[17.5%]'],
    6: ['right-[0%] top-[30%] w-[15%]', 'right-[17%] top-[30%] w-[15%]', 'right-[34%] top-[30%] w-[15%]', 'right-[51%] top-[30%] w-[15%]', 'right-[68%] top-[30%] w-[15%]', 'right-[85%] top-[30%] w-[15%]'],
  };
  const titleGridSparse = titleCardGrid && isSparseGroup;
  const positionsByVariant: Record<string, string[]> = {
    titleGrid: titleCardGrid ? (titleGridRowPositions[Math.min(Math.max(cards.length, 1), 6)] ?? titleGridRowPositions[6]) : [],
    constellation: [
      'right-[5%] top-[10%] w-[30%]',
      'left-[6%] top-[11%] w-[30%]',
      'right-[6%] bottom-[19%] w-[30%]',
      'left-[7%] bottom-[18%] w-[30%]',
      'right-[36%] bottom-[4%] w-[28%]',
      'right-[36%] top-[4%] w-[28%]',
    ],
    orbit: [
      'right-[7%] top-[8%] w-[32%]',
      'left-[7%] top-[12%] w-[32%]',
      'right-[8%] bottom-[8%] w-[32%]',
      'left-[8%] bottom-[10%] w-[32%]',
    ],
    path: [
      'right-[8%] top-[8%] w-[34%]',
      'right-[18%] top-[46%] w-[34%]',
      'left-[8%] bottom-[10%] w-[34%]',
      'left-[9%] top-[9%] w-[34%]',
    ],
    split: [
      'right-[6%] top-[12%] w-[35%]',
      'right-[24%] bottom-[0%] w-[35%]',
      'left-[7%] top-[14%] w-[35%]',
      'left-[10%] bottom-[10%] w-[35%]',
    ],
    // pptTwoPanels (exactly 2 cards) always uses 'split' too, but the
    // 4-slot array above puts its first two slots on the same (right)
    // side -- fine for the 3-card case it was tuned for, but two cards
    // stacked on one side left no room for each other. True left/right
    // panels instead, which also can't collide with Nasser regardless of
    // which side he's standing on.
    splitTwo: ['right-[6%] top-[10%] w-[38%]', 'left-[6%] top-[10%] w-[38%]'],
  };
  const labelPositions = variant === 'split' && cards.length === 2
    ? positionsByVariant.splitTwo
    : isSparseGroup && !titleCardGrid
      ? sparsePositions[cards.length]
      : positionsByVariant[variant] ?? positionsByVariant.orbit;
  // Was a pale green/gold tint, but with the green/gold Tailwind scale now
  // collapsed to one exact solid color each (no lighter shades allowed),
  // that tint became a solid color fill instead. Plain white per client
  // feedback, rather than reintroducing a "shade" to fake the old tint.
  const chapterAccent = 'bg-white/90';
  const denseMotion = cards.length >= 4;
  const showDetailText = cards.length <= 3;
  const usesOpenLabels = isEmergencySlide || variant === 'constellation' || denseMotion;
  const emergencyOpenLabels = isEmergencySlide && usesOpenLabels && !titleCardGrid;
  // orbit/path/split (non-grid) floating layouts with 3+ cards always end
  // up with at least one same-side top+bottom pair (see positionsByVariant
  // above) sharing this scene's ~305px-tall band -- there simply isn't
  // room for two full-size card visuals stacked on one side without
  // touching, at any position tuning. 2-card layouts (now opposite sides,
  // see splitTwo) don't have this problem and keep the larger visual.
  const denseFloatingCards = !titleCardGrid && !isSparseGroup && cards.length >= 3;
  const openLabelTitleClass = titleGridSparse ? 'text-[22px]' : titleCardGrid ? 'text-[18px]' : emergencyOpenLabels ? 'text-[15.5px]' : isEmergencySlide ? 'text-[22px]' : 'text-[25px]';
  const openLabelImageClass = titleGridSparse
    ? 'h-36 w-40'
    : titleCardGrid
    ? 'h-28 w-32'
    : emergencyOpenLabels
      ? (denseFloatingCards ? 'h-24 w-28' : 'h-28 w-32')
    : showDetailText
      ? (isEmergencySlide ? 'h-40 w-44' : 'h-24 w-28')
      : (isEmergencySlide ? 'h-40 w-44' : 'h-28 w-32');

  // Nasser stands on the same side for 'ppt' slides as nasserGuide computes
  // (odd slide.index -> visually left, even -> visually right; see
  // nasserGuide + NasserStoryLayer's RTL justify mapping). Only fill a quiet
  // corner with the illustration when a card slot is actually unused (fewer
  // cards than layout positions) AND that corner sits opposite Nasser —
  // otherwise we'd either leave two empty images stacked on real content or
  // paint over Nasser's own space.
  const nasserVisualSide: 'left' | 'right' = slide.index % 2 === 0 ? 'right' : 'left';
  const emptySide: 'left' | 'right' = nasserVisualSide === 'right' ? 'left' : 'right';
  const sideOfPosition = (pos: string): 'left' | 'right' => (pos.startsWith('right-') ? 'right' : 'left');
  // Nasser only occupies the bottom of his side, so a top-anchored slot on
  // his side is still safe to fill — only a bottom-anchored one on his side
  // actually collides with him.
  const collidesWithNasser = (pos: string) => sideOfPosition(pos) === nasserVisualSide && pos.includes('bottom-');
  const usedPositionIndexes = new Set(cards.map((_, i) => i % labelPositions.length));
  // A lone unused slot sharing a row with a real card (e.g. 5 cards on the
  // 6-slot titleGrid: the top row fills all 4 slots, the bottom row gets
  // exactly 1 real card plus 1 "empty" slot right next to it) used to still
  // get the decorative filler image -- a fixed 190px-tall image sitting
  // immediately beside a ~142px card reads as visual clutter/overlap, not a
  // quiet empty corner. Only fill a slot when its WHOLE row has no real
  // cards in it at all.
  const rowOf = (pos: string): 'top' | 'bottom' => (pos.includes('top-') ? 'top' : 'bottom');
  const usedRows = new Set(
    labelPositions
      .map((pos, i) => (usedPositionIndexes.has(i) ? rowOf(pos) : null))
      .filter((row): row is 'top' | 'bottom' => row !== null),
  );
  const emptyCandidates = labelPositions
    .map((pos, i) => ({ pos, i }))
    .filter(({ pos, i }) => !usedPositionIndexes.has(i) && !collidesWithNasser(pos) && !usedRows.has(rowOf(pos)));
  const preferredFill = emptyCandidates.find(({ pos }) => sideOfPosition(pos) === emptySide);
  const emptyFillIndex = (preferredFill ?? emptyCandidates[0])?.i ?? -1;
  const showMotionGraphics = !isEmergencySlide || cards.some((_, index) => visibleFor(index));
  // Shared across every card below so two cards in the same shot never end
  // up with the same big illustration or the same badge icon.
  const usedCardVisuals = new Set<string>();
  const usedBrandIcons = new Set<string>();

  return (
    <div className="relative min-h-0 flex-1 overflow-visible rounded-[30px]">
      <div className={`absolute inset-[1%] rounded-[34px] ${chapterAccent}`} />
      {showMotionGraphics && emptyFillIndex !== -1 && (
        <div className={`pointer-events-none absolute ${labelPositions[emptyFillIndex]} relative h-[190px]`} aria-hidden="true">
          <img
            src={primaryVisual}
            alt=""
            className="absolute inset-0 h-full w-full animate-float object-contain opacity-[0.18] drop-shadow-[0_22px_28px_rgb(24_82_55_/_0.10)]"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      {showMotionGraphics && variant === 'path' && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-45" viewBox="0 0 1000 430" aria-hidden="true">
          <path d="M810 84 C650 128 570 178 494 234 C405 300 300 326 168 338" fill="none" stroke="rgb(191 155 74 / 0.45)" strokeWidth="7" strokeLinecap="round" strokeDasharray="12 16" />
          <path d="M180 338 l28 -18 l-6 34z" fill="rgb(191 155 74 / 0.55)" />
        </svg>
      )}
      {showMotionGraphics && variant === 'orbit' && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" viewBox="0 0 1000 430" aria-hidden="true">
          <ellipse cx="500" cy="214" rx="270" ry="142" fill="none" stroke="rgb(31 105 72 / 0.16)" strokeWidth="4" strokeDasharray="10 14" />
          <ellipse cx="500" cy="214" rx="212" ry="105" fill="none" stroke="rgb(191 155 74 / 0.18)" strokeWidth="3" />
        </svg>
      )}
      {showMotionGraphics && variant === 'constellation' && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-45" viewBox="0 0 1000 430" aria-hidden="true">
          <path d="M225 112 C345 86 430 126 505 206 C580 126 664 88 786 118" fill="none" stroke="rgb(31 105 72 / 0.18)" strokeWidth="5" strokeLinecap="round" strokeDasharray="11 15" />
          <path d="M220 310 C340 344 435 308 506 224 C586 310 670 344 790 302" fill="none" stroke="rgb(191 155 74 / 0.22)" strokeWidth="5" strokeLinecap="round" strokeDasharray="12 14" />
          <circle cx="505" cy="214" r="6" fill="rgb(31 105 72 / 0.45)" />
        </svg>
      )}
      {showMotionGraphics && <div className="absolute inset-x-[5%] bottom-[2%] h-px bg-gradient-to-r from-transparent via-green-700/35 to-transparent" />}
      {cards.map((card, index) => {
        const visible = visibleFor(index);
        const active = activeCard === index || expandedKey === `${slide.id}:${index}`;
        const cardMarker = slide.id.startsWith('ec') || slide.id.startsWith('emergency') ? ' __bag2__' : '';
        const cardVisuals = pptGeneratedVisualLayersFor(`${card.title} ${card.text ?? ''} ${card.bullets?.join(' ') ?? ''}${cardMarker}`, visualPool[index % visualPool.length]);
        const cardVisualCandidates = uniqueVisualCandidates([
          ...(denseMotion ? [visualPool[index % visualPool.length]] : cardVisuals),
          ...visualPool,
          primaryVisual,
        ]);
        const cardVisual = cardVisualCandidates.find((src) => !usedCardVisuals.has(src)) ?? cardVisualCandidates[0];
        usedCardVisuals.add(cardVisual);
        const brandIcon = isEmergencySlide ? sharedBrandIconFor(`${card.title} ${card.text ?? ''}`, index, usedBrandIcons, usedCardVisuals) : null;
        return (
          <button
            key={index}
            type="button"
            disabled={!visible || narrationLocked}
            onClick={() => onToggle(index)}
            className={`absolute ${labelPositions[index % labelPositions.length]} isolate text-right transition-all duration-700 ease-out ${
              usesOpenLabels
                ? titleCardGrid
                  ? titleGridSparse
                    ? 'min-h-[178px] rounded-[32px] border border-green-700/10 bg-white/34 px-4 py-4 shadow-[0_18px_38px_rgb(24_82_55_/_0.09)] backdrop-blur-[2px]'
                    : 'min-h-[142px] rounded-[28px] border border-green-700/10 bg-white/34 px-3 py-3 shadow-[0_16px_34px_rgb(24_82_55_/_0.08)] backdrop-blur-[2px]'
                  : 'min-h-[104px] rounded-none border-0 bg-transparent px-1 py-1 shadow-none backdrop-blur-0'
                : 'min-h-[118px] rounded-[999px] border border-green-700/10 bg-white/45 px-5 py-3 shadow-[0_18px_34px_rgb(24_82_55_/_0.08)] backdrop-blur-sm'
            } ${
              active
                ? usesOpenLabels
                  ? 'z-20 scale-[1.04] text-brand-strong'
                  : 'scale-[1.04] border-gold-500/50 bg-white/75 text-brand-strong shadow-[0_22px_36px_rgb(24_82_55_/_0.14)]'
                : 'z-10 text-brand-strong'
            } ${visible ? revealAnimationFor(index) : 'pointer-events-none opacity-0'} ${
              visible && narrationLocked ? 'bg-white/90 text-ink-muted shadow-none' : ''
            }`}
          >
            <span className={`flex items-center justify-between ${titleCardGrid ? 'flex-col gap-2 text-center' : emergencyOpenLabels ? 'gap-3' : usesOpenLabels ? 'gap-6' : 'gap-4'}`}>
              <span className={`relative z-10 min-w-0 flex-1 ${titleCardGrid ? 'order-2 w-full border-t-[4px] border-gold-500/70 pt-2' : emergencyOpenLabels ? 'border-r-[4px] border-gold-500/70 pr-3' : usesOpenLabels ? 'border-r-[5px] border-gold-500/70 pr-4' : ''}`}>
                <span className={`flex items-center font-black leading-tight text-brand-strong drop-shadow-[0_2px_3px_rgb(255_255_255_/_0.95)] ${titleCardGrid ? 'justify-center gap-2' : 'justify-end gap-3'} ${openLabelTitleClass}`}>
                  <span>{card.title}</span>
                  {brandIcon && !titleCardGrid && !emergencyOpenLabels && (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-green-700/10 bg-white/78 p-1.5 shadow-sm" aria-hidden="true">
                      <BrandIcon src={brandIcon} tone="primary" className={`h-full w-full ${activeVisualClass(active, `${card.title} ${card.text ?? ''}`, index)}`} />
                    </span>
                  )}
                </span>
                <span
                  className={`mt-3 block h-[5px] rounded-full transition-all duration-500 ${
                    active ? 'w-[86%] bg-gold-500' : 'w-[44%] bg-green-700/18'
                  }`}
                  aria-hidden="true"
                />
              </span>
              <span className={`relative z-0 ${titleCardGrid ? 'order-1' : ''} ${openLabelImageClass} shrink-0 rounded-full bg-white/35 ring-1 ring-gold-500/16 transition-all duration-700 ${active ? 'shadow-[0_14px_28px_rgb(191_155_74_/_0.22)]' : ''}`}>
                {brandIcon && (
                  <span
                    className="absolute -right-3 -top-3 z-10 grid h-16 w-16 place-items-center rounded-2xl bg-white/88 p-1.5 shadow-[0_10px_20px_rgb(24_82_55_/_0.12)]"
                    aria-hidden="true"
                  >
                    <BrandIcon src={brandIcon} tone="primary" className={`h-full w-full ${activeVisualClass(active, `${card.title} ${card.text ?? ''}`, index)}`} />
                  </span>
                )}
                <img
                  src={cardVisual}
                  alt=""
                  className={`absolute inset-0 z-0 h-full w-full object-contain opacity-100 drop-shadow-[0_18px_24px_rgb(24_82_55_/_0.12)] ${active ? `${focusAnim} ${activeVisualAnimationFor(`${card.title} ${card.text ?? ''}`, index)}` : ''}`}
                  loading="lazy"
                  decoding="async"
                  aria-hidden="true"
                />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Horizontal numbered step-flow — for sequential processes, phases and
 *  procedures. Structurally nothing like the floating-labels motion scene:
 *  fixed in-flow badges connected left-to-right, no orbiting/positioning. */
function PptTimelineScene({
  slide,
  cards,
  activeCard,
  visibleFor,
  revealAnimationFor,
  expandedKey,
  onToggle,
}: {
  slide: Slide;
  cards: PptCard[];
  activeCard: number;
  visibleFor: (index: number) => boolean;
  revealAnimationFor: (index: number) => string;
  expandedKey: string | null;
  onToggle: (index: number) => void;
}) {
  const { isPlaying: narrationLocked } = useNarrationContext();
  const isEmergencySlide = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  const primaryVisual = slideVisualPool(slide, cards)[0];
  const showPrimaryVisual = !isEmergencySlide || cards.some((_, index) => visibleFor(index));
  const denseEmergencyTimeline = isEmergencySlide && cards.length >= 5;
  const usedBrandIcons = new Set<string>();
  return (
    <div className={`relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-visible px-2 py-2 ${denseEmergencyTimeline ? 'gap-3' : 'gap-5'}`}>
      {/* Centered with a fixed negative margin instead of -translate-x-1/2:
          the crown-rise animation's own keyframes set `transform` on every
          step (scale/translateY/rotate), which replaces the element's whole
          transform for the animation's duration -- so a translate-based
          center gets silently dropped and the badge sits shifted right by
          half its width. margin-left isn't part of `transform`, so it
          survives the animation untouched. */}
      {showPrimaryVisual && <span className={`pointer-events-none ${denseEmergencyTimeline ? 'absolute left-1/2 top-3 z-0 -ml-[48px] h-[96px] w-[96px] opacity-30' : `relative z-0 ${isEmergencySlide ? 'h-[148px] w-[148px]' : 'h-[64px] w-[64px]'}`} shrink-0 animate-crown-rise`} aria-hidden="true">
        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(233_246_239_/_0.9),rgb(255_255_255_/_0))]" />
        <svg className="absolute -inset-2 animate-aura-spin opacity-70" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="47" fill="none" stroke="rgb(191 155 74 / 0.4)" strokeWidth="2" strokeDasharray="4 9" strokeLinecap="round" />
        </svg>
        <img
          src={primaryVisual}
          alt=""
          className="absolute inset-0 h-full w-full animate-float object-contain drop-shadow-[0_14px_18px_rgb(24_82_55_/_0.14)]"
          loading="lazy"
          decoding="async"
        />
      </span>}
      <div className={`relative z-10 flex w-full ${denseEmergencyTimeline ? 'max-w-[1110px] gap-y-5 pt-10' : 'max-w-[1140px] gap-y-7'} flex-wrap items-start justify-center`}>
        {cards.map((card, index) => {
          const visible = visibleFor(index);
          const active = activeCard === index || expandedKey === `${slide.id}:${index}`;
          const detail = pptDetailFor(card, isEmergencySlide);
          const showDetail = expandedKey === `${slide.id}:${index}` && Boolean(detail);
          const brandIcon = isEmergencySlide ? sharedBrandIconFor(`${card.title} ${card.text ?? ''}`, index, usedBrandIcons) : null;
          return (
            <div key={index} className="flex items-start">
              {index > 0 && (
                <span className="relative mx-2 mt-8 hidden h-[3px] w-8 shrink-0 overflow-hidden rounded-full bg-green-700/14 sm:block" aria-hidden="true">
                  {visibleFor(index - 1) && (
                    <span
                      className="absolute inset-0 animate-shimmer-sweep bg-[length:250%_100%] bg-[linear-gradient(90deg,transparent_0%,rgb(191_155_74/0.85)_45%,rgb(255_255_255/0.95)_50%,rgb(191_155_74/0.85)_55%,transparent_100%)]"
                    />
                  )}
                </span>
              )}
              <button
                type="button"
                disabled={!visible || narrationLocked}
                onClick={() => onToggle(index)}
                className={`relative z-10 flex ${denseEmergencyTimeline ? 'w-[166px]' : isEmergencySlide ? 'w-[190px]' : 'w-[172px]'} flex-col items-center text-center transition-all duration-700 ease-out ${
                  visible ? revealAnimationFor(index) : 'pointer-events-none opacity-0'
                } ${active ? (denseEmergencyTimeline ? 'scale-[1.025]' : 'scale-[1.06]') : ''}`}
              >
                <span className={`relative grid ${denseEmergencyTimeline ? 'h-[84px] w-[84px]' : isEmergencySlide ? 'h-[104px] w-[104px]' : 'h-[64px] w-[64px]'} shrink-0 place-items-center`}>
                  {active && (
                    <span className="absolute inset-0 rounded-full border-2 border-gold-400 animate-ring-shockwave" aria-hidden="true" />
                  )}
                  <span
                    className={`absolute inset-0 grid place-items-center rounded-full border-4 text-[22px] font-extrabold tabular shadow-card transition-all duration-500 ${
                      active
                        ? 'animate-glow-cycle border-gold-400 bg-green-700 text-white shadow-card-lg'
                        : 'border-white bg-white text-green-800 ring-1 ring-green-700/16'
                    }`}
                  >
                  {brandIcon ? (
                    <BrandIcon src={brandIcon} tone={active ? 'white' : 'primary'} className={`h-[68%] w-[68%] ${activeVisualClass(active, `${card.title} ${card.text ?? ''}`, index)}`} />
                  ) : (
                    card.index ?? index + 1
                  )}
                  </span>
                </span>
                <span
                  className={`mt-3 px-4 py-2.5 transition-all duration-700 ${
                    isEmergencySlide
                      ? active
                        ? 'border-b-4 border-gold-500 text-brand-strong'
                        : 'border-b-4 border-green-700/18 text-brand-strong'
                      : active
                        ? 'rounded-[22px] border border-gold-500/40 bg-white text-brand-strong shadow-card'
                        : 'rounded-[22px] border border-green-700/12 bg-white/72 text-brand-strong shadow-[0_14px_30px_rgb(24_82_55_/_0.08)] backdrop-blur-sm'
                  }`}
                >
                  {brandIcon && !isEmergencySlide && (
                    <span className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-2xl border border-green-700/10 bg-white/80 p-1.5 shadow-sm" aria-hidden="true">
                      <BrandIcon src={brandIcon} tone="primary" className={`h-full w-full ${activeVisualClass(active, `${card.title} ${card.text ?? ''}`, index)}`} />
                    </span>
                  )}
                  <span className={`relative z-10 block font-extrabold leading-snug ${denseEmergencyTimeline ? 'text-[15.5px]' : isEmergencySlide ? 'text-[18px]' : 'text-[15.5px]'}`}>{card.title}</span>
                  {showDetail && detail && (
                    <span className="mt-1.5 block text-[11.5px] font-bold leading-snug text-ink">{detail}</span>
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 2x2 (or 2x1/1x1 fallback) quadrant grid — for matrix-shaped content like
 *  the power/interest stakeholder map or category breakdowns. Big bordered
 *  panels instead of pill-shaped cards, quadrant number as a corner tag. */
function PptMatrixScene({
  slide,
  cards,
  activeCard,
  visibleFor,
  revealAnimationFor,
  expandedKey,
  onToggle,
}: {
  slide: Slide;
  cards: PptCard[];
  activeCard: number;
  visibleFor: (index: number) => boolean;
  revealAnimationFor: (index: number) => string;
  expandedKey: string | null;
  onToggle: (index: number) => void;
}) {
  const { isPlaying: narrationLocked } = useNarrationContext();
  const isEmergencySlide = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  const cols = cards.length >= 3 ? 'grid-cols-2' : 'grid-cols-1';
  // A full 2x2 grid (4 cards) is simply taller than the window this scene
  // has to work with once both ends are respected: the top-left identity
  // logo sits ~256px down from the slide's top edge, and Nasser's layer
  // (absolutely positioned, so invisible to this flexbox) starts ~473px
  // down -- measured live via devtools against this exact slide. That's a
  // ~200px window for two rows. The roomy 2-card/2-row sizing (min-h-134,
  // p-5, text-21px title, text-16px body) measures out to ~335px for real
  // card copy, which is what actually pushed the old centered grid into the
  // logo above and Nasser below.
  //
  // Packing the row tighter isn't enough on its own if body text is left
  // free to grow: a neighboring matrix slide with a longer sentence would
  // just reproduce the same overflow. line-clamp-2 on the body text below
  // makes the row height *bounded*, not just smaller for this one slide's
  // copy, so pt-[60px] here is measured against a guaranteed worst case
  // rather than today's particular string lengths.
  const denseQuadrant = isEmergencySlide && cards.length >= 4 && cols === 'grid-cols-2';
  const usedBrandIcons = new Set<string>();
  return (
    <div className={`flex min-h-0 flex-1 flex-col items-center justify-start px-3 ${denseQuadrant ? 'pt-[60px] pb-[120px]' : 'pt-2 pb-[190px]'}`}>
      <div className={`relative grid w-full max-w-[1040px] auto-rows-fr ${cols} ${denseQuadrant ? 'gap-2' : 'gap-5'}`}>
        {cards.map((card, index) => {
          const visible = visibleFor(index);
          const active = activeCard === index || expandedKey === `${slide.id}:${index}`;
          const detail = pptDetailFor(card, isEmergencySlide);
          const showDetail = expandedKey === `${slide.id}:${index}` && Boolean(detail);
          const brandIcon = isEmergencySlide ? sharedBrandIconFor(`${card.title} ${card.text ?? ''}`, index, usedBrandIcons) : null;
          const tone = card.tone ?? 'green';
          const toneShell =
            tone === 'gold' ? 'border-gold-500/25 bg-gold-50/95' : 'border-green-700/18 bg-green-50/95';
          return (
            <button
              key={index}
              type="button"
              disabled={!visible || narrationLocked}
              onClick={() => onToggle(index)}
              className={`relative ${denseQuadrant ? 'h-[104px] overflow-hidden p-2 text-center' : 'min-h-[134px] overflow-visible p-5 text-right'} ${isEmergencySlide ? '[border-radius:44px_20px_44px_20px]' : 'rounded-[26px]'} border shadow-[0_16px_34px_rgb(24_82_55_/_0.08)] transition-all duration-700 ease-out ${
                visible ? revealAnimationFor(index) : 'pointer-events-none opacity-0'
              } ${
                active
                  ? 'scale-[1.02] animate-glow-cycle border-gold-500/45 bg-green-700 text-white shadow-card-lg'
                  : toneShell
              }`}
            >
              {active && (
                <span
                  className="pointer-events-none absolute inset-0 animate-shimmer-sweep bg-[length:250%_100%] bg-[linear-gradient(115deg,transparent_30%,rgb(255_255_255/0.28)_48%,rgb(255_255_255/0.28)_52%,transparent_70%)]"
                  aria-hidden="true"
                />
              )}
              <span
                className={`absolute ${denseQuadrant ? 'right-2 top-2 h-6 w-6 text-[10px]' : 'right-4 top-4 h-9 w-9 text-[13px]'} grid place-items-center rounded-full font-extrabold tabular ${
                  active ? 'bg-white/22 text-white ring-2 ring-white/25' : 'bg-green-700 text-white'
                }`}
              >
                {card.index ?? index + 1}
              </span>
              <h3 className={`flex items-center gap-1.5 ${denseQuadrant ? 'mx-auto max-w-[92%] justify-center pe-0 text-center text-[13px] leading-tight' : 'max-w-[88%] justify-end pe-10 text-[21px] leading-tight'} font-extrabold ${active ? 'text-white' : 'text-brand-strong'}`}>
                <span className={denseQuadrant ? 'line-clamp-1 overflow-hidden' : ''}>{card.title}</span>
                {brandIcon && (
                  <span className={`inline-grid shrink-0 place-items-center rounded-2xl shadow-sm ${denseQuadrant ? 'h-8 w-8 p-1' : 'h-14 w-14 p-1.5'} ${active ? 'bg-white/18' : 'bg-white/78'}`} aria-hidden="true">
                    <BrandIcon src={brandIcon} tone={active ? 'white' : 'primary'} className={`h-full w-full ${activeVisualClass(active, `${card.title} ${card.text ?? ''}`, index)}`} />
                  </span>
                )}
              </h3>
              {card.text && (
                <p className={`${denseQuadrant ? 'mt-0.5 line-clamp-2 overflow-hidden px-2 text-center text-[9.5px] leading-snug' : 'mt-3 pe-1 text-[16px] leading-relaxed'} font-bold ${active ? 'text-green-50' : 'text-ink'}`}>{card.text}</p>
              )}
              {showDetail && detail && (
                <div className={`mt-2 rounded-2xl border p-2 ${active ? 'border-white/25 bg-white/15' : 'border-green-700/20 bg-white/60'}`}>
                  <p className={`text-[12px] font-bold leading-snug ${active ? 'text-green-50' : 'text-ink'}`}>{detail}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** One large centered highlight (the concept Nasser is deep-diving on right
 *  now) with the remaining cards as small supporting chips beneath it —
 *  for single-concept slides (a definition, a model) rather than a set of
 *  equally-weighted items. */
function PptSpotlightScene({
  slide,
  cards,
  activeCard,
  visibleFor,
  revealAnimationFor,
  expandedKey,
  onToggle,
}: {
  slide: Slide;
  cards: PptCard[];
  activeCard: number;
  visibleFor: (index: number) => boolean;
  revealAnimationFor: (index: number) => string;
  expandedKey: string | null;
  onToggle: (index: number) => void;
}) {
  const { isPlaying: narrationLocked } = useNarrationContext();
  const isEmergencySlide = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  const focusIndex = activeCard >= 0 ? activeCard : 0;
  const focusCard = cards[focusIndex];
  const supporting = cards.filter((_, i) => i !== focusIndex);
  const focusVisible = visibleFor(focusIndex);
  const focusActive = expandedKey === `${slide.id}:${focusIndex}`;
  const focusDetail = pptDetailFor(focusCard, isEmergencySlide);
  const showFocusDetail = focusActive && Boolean(focusDetail);
  const primaryVisual = slideVisualPool(slide, cards)[0];
  const usedBrandIcons = new Set<string>();
  const focusBrandIcon = isEmergencySlide ? sharedBrandIconFor(`${focusCard?.title ?? ''} ${focusCard?.text ?? ''}`, focusIndex, usedBrandIcons) : null;
  const showFocusVisual = !isEmergencySlide || focusVisible;
  // Enough supporting chips (5+, i.e. a 6-card slide -- only two of these
  // exist in bag 2) would wrap onto a second row at the normal chip size;
  // packed tighter they fit a single row instead, which matters below.
  const denseSupporting = supporting.length >= 5;
  // This column is centered across the full scene height with no regard
  // for Nasser's own (absolutely-positioned, so layout-invisible) layer,
  // so the supporting-chips row could end up sitting under him. Pushing it
  // up with bottom padding is enough for the normal (single-row) case --
  // verified against the tightest normal slide. The dense case is packed
  // tight enough now (see denseSupporting above) that it doesn't need the
  // same large padding; centering it like the normal case keeps the
  // vertical rhythm consistent instead of packing it against the title.
  return (
    <div className={`flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-4 ${denseSupporting ? 'pb-[70px]' : 'pb-[65px]'}`}>
      <button
        type="button"
        disabled={!focusVisible || narrationLocked}
        onClick={() => onToggle(focusIndex)}
        className={`relative isolate w-full ${isEmergencySlide ? 'min-h-[150px] max-w-[720px] px-8 py-5' : 'max-w-[620px] p-7'} overflow-visible rounded-[36px] border text-center shadow-[0_22px_44px_rgb(24_82_55_/_0.12)] transition-all duration-500 ${
          focusVisible ? 'animate-epic-pop' : 'pointer-events-none opacity-0'
        } ${focusVisible ? 'animate-glow-cycle' : ''} border-gold-500/35 bg-green-700 text-white`}
      >
        {focusVisible && (
          <span
            className="pointer-events-none absolute inset-0 animate-shimmer-sweep bg-[length:250%_100%] bg-[linear-gradient(115deg,transparent_35%,rgb(255_255_255/0.22)_48%,rgb(255_255_255/0.22)_52%,transparent_65%)]"
            aria-hidden="true"
          />
        )}
        {showFocusVisual && (
          <span
            className={`pointer-events-none absolute z-0 ${isEmergencySlide ? '-left-4 -top-4 h-[104px] w-[104px] opacity-70' : '-left-8 -top-8 h-[92px] w-[92px]'} rounded-full border-4 border-white bg-white shadow-card-lg`}
            aria-hidden="true"
          >
            <svg className="absolute -inset-2 animate-aura-spin opacity-70" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="47" fill="none" stroke="rgb(191 155 74 / 0.5)" strokeWidth="2" strokeDasharray="3 8" strokeLinecap="round" />
            </svg>
            <img src={primaryVisual} alt="" className={`absolute inset-0 h-full w-full rounded-full object-contain p-1.5 ${activeVisualClass(focusVisible, `${focusCard?.title ?? ''} ${focusCard?.text ?? ''}`, focusIndex)}`} loading="lazy" decoding="async" />
          </span>
        )}
        <span className="relative z-10 mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-white/16 p-2.5 ring-2 ring-white/25">
          {focusBrandIcon ? (
            <BrandIcon src={focusBrandIcon} tone="white" className={`h-full w-full ${activeVisualClass(focusVisible, `${focusCard?.title ?? ''} ${focusCard?.text ?? ''}`, focusIndex)}`} />
          ) : (
            <CourseGlyph kind={courseGlyphKind(`${focusCard?.title ?? ''} ${focusCard?.text ?? ''}`)} active compact />
          )}
          <svg className="pointer-events-none absolute -right-1.5 -top-1.5 h-3.5 w-3.5 animate-sparkle" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" fill="#9b945f" />
          </svg>
          <svg className="pointer-events-none absolute -bottom-1.5 -left-1.5 h-2.5 w-2.5 animate-sparkle" style={{ animationDelay: '0.9s' }} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" fill="#9b945f" />
          </svg>
        </span>
        <h3 className={`relative z-10 ${isEmergencySlide ? 'mx-auto max-w-[560px] text-[21px]' : 'text-[26px]'} font-extrabold leading-tight`}>{focusCard?.title}</h3>
        {focusCard?.text && <p className={`relative z-10 ${isEmergencySlide ? 'mx-auto max-w-[520px] text-[14.5px]' : 'text-[16px]'} mt-1.5 font-bold leading-snug text-green-50`}>{focusCard.text}</p>}
        {showFocusDetail && focusDetail && (
          <div className="mx-auto mt-3 max-w-[520px] rounded-2xl border border-white/25 bg-white/15 p-2.5">
            <p className="text-[13px] font-bold leading-snug text-green-50">{focusDetail}</p>
          </div>
        )}
      </button>
      {supporting.length > 0 && (
        <div className={`flex w-full ${denseSupporting ? 'max-w-[760px] gap-2' : 'max-w-[820px] gap-3'} flex-wrap items-stretch justify-center`}>
          {supporting.map((card) => {
            const index = cards.indexOf(card);
            const visible = visibleFor(index);
            const active = expandedKey === `${slide.id}:${index}`;
            const brandIcon = isEmergencySlide ? sharedBrandIconFor(`${card.title} ${card.text ?? ''}`, index, usedBrandIcons) : null;
            return (
              <button
                key={index}
                type="button"
                disabled={!visible || narrationLocked}
                onClick={() => onToggle(index)}
                className={`${denseSupporting ? 'min-w-[128px]' : 'min-w-[170px]'} flex-1 ${isEmergencySlide ? `border-b-4 ${denseSupporting ? 'px-2 py-2' : 'px-4 py-2'} shadow-none` : 'rounded-[22px] border px-4 py-3 shadow-[0_14px_28px_rgb(24_82_55_/_0.07)]'} text-center transition-all duration-500 ${
                  visible ? revealAnimationFor(index) : 'pointer-events-none opacity-0'
                } ${
                  active
                    ? isEmergencySlide
                      ? 'animate-glow-cycle scale-[1.03] border-gold-500 text-brand-strong'
                      : 'animate-glow-cycle scale-[1.03] border-gold-500/40 bg-white text-brand-strong shadow-card'
                    : isEmergencySlide
                      ? 'border-green-700/16 text-brand-strong'
                      : 'border-green-700/14 bg-white/75 text-brand-strong'
                }`}
              >
                {brandIcon && (
                  <span className={`mx-auto ${denseSupporting ? 'mb-1 h-10 w-10' : 'mb-2 h-14 w-14'} grid place-items-center rounded-2xl border border-green-700/10 bg-white/78 p-1 shadow-sm`} aria-hidden="true">
                    <BrandIcon src={brandIcon} tone="primary" className={`h-full w-full ${activeVisualClass(active, `${card.title} ${card.text ?? ''}`, index)}`} />
                  </span>
                )}
                <span className={`block ${denseSupporting ? 'text-[12.5px]' : 'text-[14.5px]'} font-extrabold leading-snug`}>{card.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
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
  const { isPlaying: narrationLocked } = useNarrationContext();
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
      <div className="flex h-full min-h-0 flex-col px-7 py-3">
        <PptTitle slide={slide} showVisual={!slide.id.startsWith('ec') || spoken > 0} />
        <div className="mb-3 rounded-lg border-r-8 border-gold-500 bg-white/95 px-3.5 py-2.5 text-right shadow-sm">
          <p className="text-[18px] font-extrabold leading-snug text-brand-strong">{slide.ppt?.intro}</p>
          <p className="mt-0.5 text-[16px] font-bold leading-snug text-ink-soft">{slide.ppt?.prompt}</p>
        </div>
        <div className="grid min-h-0 flex-1 items-center grid-cols-[1fr_190px] gap-3">
          {currentCard && (
            <div
              key={currentStep}
              data-ppt-card="true"
              aria-hidden={!currentCardVisible}
              className={`relative grid h-full min-h-0 grid-cols-[190px_1fr] items-center gap-5 overflow-visible rounded-[34px] border px-6 py-4 text-right shadow-[0_18px_42px_rgb(24_82_55_/_0.10)] transition-all duration-500 ${
                answerVisible
                  ? 'scale-[1.01] border-gold-500/45 bg-green-700 text-white'
                  : 'border-green-700/14 bg-white/90 text-brand-strong'
              } ${currentCardVisible ? PPT_REVEAL_ANIMS[currentStep % PPT_REVEAL_ANIMS.length] : 'pointer-events-none opacity-0'}`}
            >
              <span className={`pointer-events-none absolute right-5 top-5 h-3 w-14 rounded-full ${answerVisible ? 'bg-gold-300' : 'bg-green-700'} opacity-80`} />
              <span className={`relative grid h-[132px] w-[180px] place-items-center rounded-[28px] border shadow-[0_18px_34px_rgb(24_82_55_/_0.14)] ${
                answerVisible ? 'border-white/35 bg-white/16' : 'border-green-700/14 bg-white'
              }`}>
                <img
                  src={pptGeneratedVisualLayersFor(`${currentCard.title} ${currentCard.text ?? ''}`)[0]}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-contain drop-shadow-[0_14px_18px_rgb(24_82_55_/_0.16)] ${activeVisualClass(currentCardVisible, `${currentCard.title} ${currentCard.text ?? ''}`, currentStep) || 'animate-float'}`}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <div className="relative z-10 min-w-0">
                <h3 className={`text-[25px] font-black leading-tight ${answerVisible ? 'text-white' : 'text-brand-strong'}`}>
                  {answerVisible ? `الإجابة: ${currentCard.answer}` : currentCard.title}
                </h3>
                <p className={`mt-3 text-[20px] font-bold leading-relaxed ${answerVisible ? 'text-green-50' : 'text-ink'}`}>
                  {answerVisible ? currentCard.rationale : currentCard.text}
                </p>
              </div>
            </div>
          )}
          <div className={`flex min-h-0 flex-col justify-center gap-2 rounded-lg border-2 border-green-700/20 bg-white/92 p-2.5 transition-all ${activityReady ? 'animate-slide-in opacity-100' : 'pointer-events-none opacity-0'}`}>
            <button
              type="button"
              disabled={phase !== 'awaiting-answer' || narrationLocked}
              onClick={() => answerQuestion('حوكمة')}
              className={`rounded-lg border-2 px-4 py-3 text-[19px] font-extrabold transition-all disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
                phase === 'awaiting-answer' && !narrationLocked ? 'animate-pulse-ring' : ''
              } ${selectedAnswer === 'حوكمة' ? 'border-green-700 bg-green-700 text-white' : 'border-green-700/25 bg-green-700/8 text-green-800 hover:bg-green-700/15'}`}
            >
              حوكمة
            </button>
            <button
              type="button"
              disabled={phase !== 'awaiting-answer' || narrationLocked}
              onClick={() => answerQuestion('امتثال')}
              className={`rounded-lg border-2 px-4 py-3 text-[19px] font-extrabold transition-all disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
                phase === 'awaiting-answer' && !narrationLocked ? 'animate-pulse-ring' : ''
              } ${selectedAnswer === 'امتثال' ? 'border-gold-600 bg-gold-500 text-white' : 'border-gold-500/35 bg-gold-500/10 text-gold-700 hover:bg-gold-500/18'}`}
            >
              امتثال
            </button>
            {selectedAnswer && phase === 'awaiting-next' && (
              <button
                type="button"
                disabled={narrationLocked}
                onClick={nextQuestion}
                className={`btn-gold mt-1 justify-center px-4 py-2.5 text-[17px] disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
                  narrationLocked ? '' : 'animate-pulse-ring'
                }`}
              >
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
  const analysisCards = cards.slice(1);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const [questionReady, setQuestionReady] = useState(true);
  const [discussionReady, setDiscussionReady] = useState(false);
  const [discussionVisible, setDiscussionVisible] = useState(false);
  const guidedSpeech = useGuidedSpeech(slide, muted);
  const { isPlaying: narrationLocked } = useNarrationContext();
  const portalRoot = useCanvasPortal();
  const currentCard = selectedStep != null ? analysisCards[selectedStep] : undefined;
  const ready = spoken >= slide.narration.length * 0.72;
  const questions = conflictScenarioQuestions;
  const discussions = conflictScenarioDiscussions;
  const currentQuestion = selectedStep != null ? questions[selectedStep] : undefined;
  const interactionLine = guidedSpeech.line ?? (selectedStep != null && questionReady && !discussionVisible ? currentQuestion : undefined);

  const closeModal = () => {
    if (guidedSpeech.speaking) return;
    setSelectedStep(null);
    setDiscussionVisible(false);
    setQuestionReady(true);
    setDiscussionReady(false);
  };

  const openStep = (nextStep: number) => {
    if (!ready || complete || guidedSpeech.speaking) return;
    setSelectedStep(nextStep);
    setDiscussionVisible(false);
    setDiscussionReady(false);
    setQuestionReady(false);
    guidedSpeech.speak(`${slide.audioKey}-question-${nextStep + 1}`, questions[nextStep], () => setQuestionReady(true));
  };

  const revealDiscussion = () => {
    if (!ready || selectedStep == null || !questionReady || discussionVisible || complete) return;
    setDiscussionVisible(true);
    setQuestionReady(false);
    setDiscussionReady(false);
    const discussion = discussions[selectedStep];
    guidedSpeech.speak(`${slide.audioKey}-discussion-${selectedStep + 1}`, discussion, () => setDiscussionReady(true));
  };

  const finishScenario = () => {
    if (!discussionVisible || !discussionReady) return;
    setComplete(true);
    setSelectedStep(null);
    setDiscussionVisible(false);
    guidedSpeech.speak(`${slide.audioKey}-complete`, conflictScenarioCompletion, () => onActivityDone(slide.id));
  };

  return (
    <StorySlideShell
      slide={slide}
      spoken={spoken}
      showDialogue={showDialogue || Boolean(interactionLine)}
      dialogueOverride={interactionLine}
    >
      <div className="flex h-full min-h-0 flex-col px-8 py-3">
        <PptTitle slide={slide} showVisual={!slide.id.startsWith('ec') || spoken > 0} />
        <div className="grid min-h-0 flex-1 grid-cols-[1.05fr_0.95fr] gap-5">
          {scenarioCard && (
            <div className="relative flex min-h-0 flex-col justify-center overflow-visible rounded-[34px] border border-green-700/12 bg-white/96 p-4 text-right shadow-[0_22px_55px_rgb(24_82_55_/_0.12)]">
              <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-green-500/12 blur-3xl" />
              <span className="pointer-events-none absolute -left-10 -bottom-10 h-44 w-44 rounded-full bg-gold-500/14 blur-3xl" />
              <div className="relative z-10 min-h-[164px]">
                {spoken > 0 && (
                  <img
                    src={pptGeneratedVisualLayersFor(`${scenarioCard.title} ${scenarioCard.text}`)[0] ?? '/assets/visual-library/audit-controls.webp'}
                    alt=""
                    className="pointer-events-none absolute left-3 top-2 h-[118px] w-[132px] object-contain opacity-20 drop-shadow-[0_18px_28px_rgb(0_0_0_/_0.14)]"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className="relative z-10 min-w-0 rounded-[24px] border border-green-700/10 bg-white/95 p-3.5 shadow-[0_14px_26px_rgb(24_82_55_/_0.08)]">
                  <p className="text-[16px] font-black text-gold-700">سيناريو تطبيقي</p>
                  <h3 className="mt-1 text-[25px] font-black leading-tight text-brand-strong">{scenarioCard.title}</h3>
                  <p className="mt-2 text-[18px] font-bold leading-snug text-ink">{scenarioCard.text}</p>
                </div>
              </div>
              <div className="relative z-10 mt-3 rounded-[22px] border border-gold-500/24 bg-gold-500/10 px-4 py-2.5 text-[15px] font-extrabold leading-snug text-brand-strong">
                اختر كل محطة واضغط عليها، وخذ لحظتك في التفكير قبل مناقشتها مع ناصر.
              </div>
            </div>
          )}
          <div className={`grid min-h-0 content-center gap-4 transition-all duration-500 ${ready ? 'opacity-100' : 'pointer-events-none opacity-0 translate-y-3'}`}>
            {analysisCards.map((card, index) => {
              const active = selectedStep === index;
              return (
                <button
                  key={`${card.title}-${index}`}
                  type="button"
                  onClick={() => openStep(index)}
                  disabled={!ready || guidedSpeech.speaking || complete || narrationLocked}
                  className={`group flex items-center justify-between gap-4 rounded-[28px] border px-5 py-5 text-right shadow-[0_16px_38px_rgb(24_82_55_/_0.10)] transition-all duration-300 hover:-translate-y-1 ${
                    active
                      ? 'border-green-700 bg-green-800 text-white'
                      : 'border-green-700/12 bg-white/86 text-brand-strong hover:border-gold-500/45 hover:bg-gold-50'
                  } ${complete ? 'opacity-70' : ''} ${
                    ready && !guidedSpeech.speaking && !complete && !narrationLocked ? 'animate-pulse-ring' : ''
                  } ${narrationLocked && ready ? '!bg-white !text-ink-muted !border-line' : ''}`}
                >
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${active ? 'bg-white/16' : 'bg-green-700/8'}`}>
                    <Icon name={index === 0 ? 'gavel' : index === 1 ? 'shield' : 'sparkles'} className={`h-8 w-8 ${active ? `text-white ${activeVisualAnimationFor(`${card.title} ${card.text ?? ''}`, index)}` : 'text-green-700'}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[23px] font-black leading-tight">{card.title}</span>
                    <span className={`mt-1 block text-[15px] font-bold ${active ? 'text-white/82' : 'text-ink-soft'}`}>اضغط لفتح المحطة ومناقشتها</span>
                  </span>
                  <Icon name={active ? 'check' : 'flow'} className={`h-7 w-7 shrink-0 ${active ? `text-green-600 ${activeVisualAnimationFor(`${card.title} ${card.text ?? ''}`, index + 3)}` : 'text-gold-600 group-hover:text-green-700'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {complete && (
          <div className="pointer-events-none absolute inset-x-[18%] bottom-7 rounded-3xl border border-green-500/35 bg-white/88 px-6 py-4 text-center text-[20px] font-extrabold text-brand-strong shadow-card animate-fade-up">
            تم تحليل السيناريو. انتقل للاختبار لما تكون جاهزًا.
          </div>
        )}

        {selectedStep != null && currentCard && createPortal(
          <div className="pointer-events-auto absolute inset-0 z-[80] flex items-center justify-center p-8">
            <button
              type="button"
              disabled={narrationLocked}
              className="absolute inset-0 cursor-default bg-green-950/34 backdrop-blur-[6px] disabled:cursor-not-allowed"
              aria-label="إغلاق نافذة السيناريو"
              onClick={closeModal}
            />
            <div className="relative z-10 grid h-[600px] w-full max-w-[1120px] grid-cols-[1fr_0.82fr] overflow-visible rounded-[38px] border border-green-700/18 bg-white shadow-[0_35px_80px_rgb(0_45_28_/_0.24)] animate-scale-in">
              <button
                type="button"
                disabled={narrationLocked}
                onClick={closeModal}
                className="absolute left-5 top-5 z-20 grid h-11 w-11 place-items-center rounded-full bg-white text-green-900 shadow-card ring-1 ring-green-700/15 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none"
                aria-label="إغلاق"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
              <div className="relative flex min-h-0 flex-col justify-center overflow-visible bg-white p-9 text-right">
                <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-green-700/10 blur-3xl" />
                <span className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-gold-500/14 blur-3xl" />
                <div className="relative z-10">
                  <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-gold-500/15 px-4 py-1.5 text-[15px] font-extrabold text-gold-700">
                    محطة {toArabicDigits(selectedStep + 1)}
                  </span>
                  <h3 className="text-[34px] font-black leading-tight text-brand-strong">{currentCard.title}</h3>
                  <p className="mt-4 rounded-[26px] border border-green-700/14 bg-white/82 p-5 text-[22px] font-extrabold leading-relaxed text-ink shadow-[0_14px_30px_rgb(24_82_55_/_0.08)]">
                    {scenarioCard?.text}
                  </p>
                  <div className="mt-5 rounded-[26px] border border-gold-500/30 bg-gold-500/10 p-5">
                    <p className="mb-2 flex items-center gap-2 text-[16px] font-black text-gold-700">
                      <Icon name="sound" className="h-5 w-5" />
                      سؤال ناصر
                    </p>
                    <p className="text-[21px] font-extrabold leading-relaxed text-brand-strong">{currentQuestion}</p>
                  </div>
                  {discussionVisible && (
                    <div className="mt-4 rounded-[26px] border border-green-500/28 bg-green-500/8 p-5 animate-fade-up">
                      <p className="mb-2 text-[16px] font-black text-green-700">مناقشة ناصر</p>
                      <p className="text-[19px] font-bold leading-relaxed text-ink">{currentCard.text}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative flex min-h-0 flex-col items-center justify-center bg-green-800 p-8 text-center text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgb(255_255_255_/_0.18),transparent_34%)]" />
                <div className="relative z-10 mb-4 grid place-items-center">
                  <img
                    src={POSE_SRC[discussionVisible ? 'thinking' : 'question']}
                    alt="ناصر المدرب"
                    className={`h-[240px] w-[240px] object-contain drop-shadow-[0_20px_26px_rgb(0_0_0_/_0.28)] transition-transform duration-500 ${
                      guidedSpeech.speaking ? 'scale-[1.04]' : ''
                    }`}
                  />
                  {guidedSpeech.speaking && (
                    <span className="absolute -bottom-1 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[13px] font-black text-green-800 shadow-card">
                      <Icon name="sound" className="h-4 w-4 animate-pulse" />
                      ناصر بيتكلم الآن
                    </span>
                  )}
                </div>
                <img
                  src={pptGeneratedVisualLayersFor(`${currentCard.title} ${currentCard.text ?? ''}`)[0] ?? '/assets/visual-library/audit-controls.webp'}
                  alt=""
                  className={`relative z-10 mb-5 h-[140px] w-[190px] object-contain drop-shadow-[0_26px_34px_rgb(0_0_0_/_0.22)] ${activeVisualClass(guidedSpeech.speaking || discussionVisible, `${currentCard.title} ${currentCard.text ?? ''}`, selectedStep)}`}
                  loading="lazy"
                  decoding="async"
                />
                <p className="relative z-10 text-[22px] font-black leading-relaxed">
                  اقرأ السيناريو، فكر في إجابتك، ثم افتح مناقشة ناصر.
                </p>
                <div className="relative z-10 mt-7 flex w-full flex-col gap-3">
                  {!discussionVisible && questionReady && (
                    <button
                      type="button"
                      disabled={narrationLocked}
                      onClick={revealDiscussion}
                      className={`btn-gold justify-center px-7 py-4 text-[19px] disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
                        narrationLocked ? '' : 'animate-pulse-ring'
                      }`}
                    >
                      ناقش الإجابة مع ناصر
                    </button>
                  )}
                  {discussionVisible && discussionReady && selectedStep < analysisCards.length - 1 && (
                    <button
                      type="button"
                      disabled={narrationLocked}
                      onClick={closeModal}
                      className={`rounded-2xl bg-white px-7 py-4 text-[18px] font-black text-green-800 shadow-card transition hover:bg-green-50 disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
                        narrationLocked ? '' : 'animate-pulse-ring'
                      }`}
                    >
                      اختيار محطة أخرى
                    </button>
                  )}
                  {discussionVisible && discussionReady && selectedStep >= analysisCards.length - 1 && (
                    <button
                      type="button"
                      disabled={narrationLocked}
                      onClick={finishScenario}
                      className={`btn-gold justify-center px-7 py-4 text-[19px] disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
                        narrationLocked ? '' : 'animate-pulse-ring'
                      }`}
                    >
                      إنهاء المناقشة
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          portalRoot ?? document.body,
        )}
      </div>
    </StorySlideShell>
  );
}

// Client feedback: a new slide feels empty right as Nasser starts talking,
// since the real cards only reveal at their own exact word (see
// pptCardRevealOffsets). This bridges that gap with 1-3 plain topic images
// (no text) that cross-fade in from the very first word, then hand off to
// the real synced scene the instant the first real card is due -- purely
// decorative, never claiming to be "the" explanation for anything.
//
// The pool mixes one topic-specific illustration matched against the
// actual words spoken during this intro window (via pptGeneratedVisualLayersFor,
// so it's expressive of what Nasser is saying right then, not just the
// slide's general subject) with icons drawn from the much larger shared
// icon library, rotated by the slide's own position so which icons show up
// keeps changing slide to slide -- the library is large enough that a full
// cycle takes well over five slides, so nothing feels like it's repeating
// on every screen.
const TOPIC_IMAGE_COOLDOWN = 5;

function introVisualPoolFor(slide: Slide, introText: string): string[] {
  const isEmergencySlide = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  const marker = isEmergencySlide ? ' __bag2__' : '';
  // Chapter 1's own vocabulary (ICS/EOC/قيادة/تنسيق) is broad enough that
  // pptGeneratedVisualLayersFor's keyword rules match almost every slide's
  // opening sentence, so its single best match alone (never mind its own
  // "pad with a second" fallback) still tends to be the same handful of
  // images -- mostly emergency-command-center and emergency-strategic-
  // framework -- over and over. Each candidate image only "owns" one
  // slide-index residue mod 5 (via a stable hash of its own filename), so
  // the very same image can only be offered again five slides later at the
  // earliest; every other slide it would have matched instead falls back to
  // two more icons from the rotation below.
  const topicCandidate = pptGeneratedVisualLayersFor(`${introText}${marker}`)[0];
  const topicAllowed = Boolean(
    topicCandidate && Math.max(0, slide.index) % TOPIC_IMAGE_COOLDOWN === stableIconIndex(topicCandidate) % TOPIC_IMAGE_COOLDOWN,
  );
  const topicMatch = topicAllowed && topicCandidate ? [topicCandidate] : [];
  const startIndex = (Math.max(0, slide.index) * 3) % SHARED_BRAND_ICON_POOL.length;
  const rotatedIcons = [
    ...SHARED_BRAND_ICON_POOL.slice(startIndex),
    ...SHARED_BRAND_ICON_POOL.slice(0, startIndex),
  ];
  const combined: string[] = [];
  const add = (src: string) => {
    if (!combined.includes(src)) combined.push(src);
  };
  topicMatch.forEach(add);
  rotatedIcons.forEach(add);
  return combined.slice(0, 3);
}

function PptIntroVisualFiller({ pool, progress, introText }: { pool: string[]; progress: number; introText: string }) {
  const shown = pool.slice(0, Math.min(3, pool.length));
  if (!shown.length) return null;
  const activeIndex = Math.min(shown.length - 1, Math.floor(progress * shown.length));
  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible">
      {shown.map((src, i) => {
        const active = i === activeIndex;
        return (
          <img
            key={src}
            src={src}
            alt=""
            draggable={false}
            className={`absolute inset-0 m-auto max-h-[300px] max-w-[64%] object-contain drop-shadow-[0_22px_36px_rgb(24_82_55_/_0.16)] transition-[opacity,transform] duration-700 ease-out ${
              active ? `opacity-100 motion-layer-focus ${activeVisualAnimationFor(introText, i)}` : 'scale-90 opacity-0'
            }`}
          />
        );
      })}
    </div>
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
  const narration = useNarrationContext();
  const { isPlaying: narrationLocked } = narration;
  const [resolvedCheckpoints, setResolvedCheckpoints] = useState<Set<number>>(() => new Set());
  const [answeredCheckpointIndex, setAnsweredCheckpointIndex] = useState<number | null>(null);
  const pausedCheckpointRef = useRef<number | null>(null);

  // When real audio is missing/fails for a slide, the sync clock can snap
  // `spoken` straight to the narration's full length within a second or two
  // instead of the real speaking duration -- which would otherwise let the
  // quick-check popup below fire almost immediately after the slide opens.
  // Track wall-clock time since this slide mounted (reset synchronously
  // during render, not in an effect, so the very first render already has
  // the correct baseline) and require a sane minimum dwell time in
  // addition to `narrationFinished` before the check can trigger.
  const slideEnteredAtRef = useRef(performance.now());
  const slideIdRef = useRef(slide.id);
  if (slideIdRef.current !== slide.id) {
    slideIdRef.current = slide.id;
    slideEnteredAtRef.current = performance.now();
    pausedCheckpointRef.current = null;
    if (resolvedCheckpoints.size > 0) setResolvedCheckpoints(new Set());
    if (answeredCheckpointIndex != null) setAnsweredCheckpointIndex(null);
  }
  const minDwellMs = Math.max(4000, slide.duration * 1000 * 0.6);

  if (slide.layout === 'pptActivitySort') {
    return <PptActivitySlide slide={slide} spoken={spoken} muted={muted} showDialogue={showDialogue} onActivityDone={onActivityDone} />;
  }
  if (slide.layout === 'pptScenario') {
    return <PptGuidedScenarioSlide slide={slide} spoken={spoken} muted={muted} showDialogue={showDialogue} onActivityDone={onActivityDone} />;
  }

  const cardActs = [slide.ppt?.cards ?? [], ...(slide.ppt?.laterActs ?? [])];
  const hasMultipleActs = cardActs.length > 1;
  // A slide with laterActs is treated as one continuous list for every
  // timing/index computation below (cue matching, reveal offsets,
  // click-to-replay) -- each card still gets matched against its own real
  // mention in the narration regardless of which act it conceptually
  // belongs to. Only the final render step (see displayCards etc. further
  // down) splits it back into whichever single act is on screen.
  const cards = hasMultipleActs ? cardActs.flat() : cardActs[0];
  const actStartIndices = cardActs.reduce<number[]>((acc, _act, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + cardActs[i - 1].length);
    return acc;
  }, []);
  const checks = slide.ppt?.checks ?? [];
  const isEmergencySlide = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  const narrationPosition = started ? spoken : 0;
  const revealCueIndexes = pptCardCueIndexes(cards, slide.narration);
  // Character-level reveal timing: several cards are routinely named in the
  // very same sentence, so snapping them all to that sentence's cue (as
  // revealCueIndexes does, for the coarser "which chunk to replay" job
  // below) would pop them in together the instant it starts. This finds
  // each card's own word position instead, so a shared sentence still
  // reveals its cards one at a time, in step with Nasser actually saying
  // each one.
  const revealOffsets = pptCardRevealOffsets(cards, slide.narration);
  // The exact stretch of the slide's own narration where Nasser talked
  // about this card — used to replay that original recording instead of
  // synthesizing new text/audio when the learner reopens the card.
  const cardNarrationRange = (index: number) => {
    const cues = storyCues(slide.narration);
    const startCue = cues[revealCueIndexes[index] ?? 0];
    const nextCueIndex = revealCueIndexes[index + 1];
    const endCue = nextCueIndex != null ? cues[nextCueIndex] : undefined;
    const start = startCue?.start ?? 0;
    const end = endCue?.start ?? slide.narration.length;
    return { start, end, text: slide.narration.slice(start, end).trim() };
  };
  const cardReplayRange = (index: number) => {
    const cues = storyCues(slide.narration);
    const card = cards[index];
    if (!card || !cues.length) return cardNarrationRange(index);

    const bestCueFor = (target: PptCard, after = -1) => {
      let best = { cueIndex: -1, score: 0 };
      for (let cueIndex = after + 1; cueIndex < cues.length; cueIndex += 1) {
        const score = scorePptCardCue(target, cues[cueIndex].text);
        if (score > best.score) best = { cueIndex, score };
      }
      return best;
    };

    const best = bestCueFor(card);
    if (best.cueIndex < 0 || best.score < 5) return cardNarrationRange(index);

    let endCueIndex = cues.length;
    for (let nextIndex = index + 1; nextIndex < cards.length; nextIndex += 1) {
      const nextBest = bestCueFor(cards[nextIndex], best.cueIndex);
      if (nextBest.cueIndex > best.cueIndex && nextBest.score >= 5) {
        endCueIndex = nextBest.cueIndex;
        break;
      }
    }

    const start = cues[best.cueIndex]?.start ?? 0;
    const end = cues[endCueIndex]?.start ?? slide.narration.length;
    return { start, end, text: slide.narration.slice(start, end).trim() };
  };
  const narrationFinished = narrationPosition >= slide.narration.length - 1;
  const activeCard =
    narrationPosition > 0 && !narrationFinished
      ? activePptCardForCue(revealOffsets, narrationPosition)
      : -1;
  // Bag 1 can rest as a complete poster, but Bag 2 is authored as a
  // Nasser-led motion scene: visuals stay hidden until the audio clock starts.
  const idleAtSlideStart = narrationPosition <= 0;
  const cardIsVisible = (index: number) =>
    isEmergencySlide
      ? narrationFinished || (narrationPosition > 0 && narrationPosition >= (revealOffsets[index] ?? 0))
      : !started || idleAtSlideStart || narrationFinished || (narrationPosition > 0 && narrationPosition >= (revealOffsets[index] ?? 0));
  const revealedCount = cards.filter((_, i) => cardIsVisible(i)).length;
  const actSwitchOffsets = actStartIndices.map((startIndex) => revealOffsets[startIndex] ?? 0);
  // Split the combined `cards` back into whichever single act is on screen
  // right now. Narration crosses into the next act the moment that act's
  // first card starts revealing (same offset-matching used for every other
  // card) -- until then this is a no-op (act index 0, full cards list), so
  // slides without laterActs render through exactly the same values as
  // before this existed.
  let rawActiveActIndex = 0;
  for (let i = 1; i < cardActs.length; i += 1) {
    if (narrationFinished || (narrationPosition > 0 && narrationPosition >= (actSwitchOffsets[i] ?? 0))) rawActiveActIndex = i;
  }
  const activeActIndex = rawActiveActIndex;
  // A slide's acts don't have to share one visual shape -- actLayouts lets
  // each act name its own (e.g. spotlight for the framing card, matrix for
  // a 2x2 breakdown), falling back to the slide's own layout when unset.
  const activeLayout = slide.ppt?.actLayouts?.[activeActIndex] ?? slide.layout;
  // Switching acts used to hard-cut: the outgoing act's DOM just vanished
  // the instant the new one mounted, with only the incoming side ever
  // getting an animation. This snapshots the outgoing act's own cards +
  // layout the moment activeActIndex changes and keeps rendering that
  // snapshot -- frozen, fully revealed, non-interactive -- fading out behind
  // the incoming act for one beat instead of disappearing instantly.
  const [leavingAct, setLeavingAct] = useState<{ cards: PptCard[]; layout?: PptLayout } | null>(null);
  const lastActIndexRef = useRef(activeActIndex);
  useEffect(() => {
    if (activeActIndex === lastActIndexRef.current) return;
    const prevIndex = lastActIndexRef.current;
    lastActIndexRef.current = activeActIndex;
    setLeavingAct({ cards: cardActs[prevIndex], layout: slide.ppt?.actLayouts?.[prevIndex] ?? slide.layout });
    const timer = window.setTimeout(() => setLeavingAct(null), 550);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeActIndex]);
  const isIntro = slide.layout === 'pptIntro';
  const isIntroRoadmap = slide.id === 'program-map';
  const isIntroMotion = isIntro || isIntroRoadmap;
  const isConclusion = slide.layout === 'pptConclusion';
  const isThree = activeLayout === 'pptThreeColumns';
  const isTwoPanel = activeLayout === 'pptTwoPanels';
  const motionStarted = started || spoken > 0 || showDialogue;

  // Previously bridged the gap between Nasser starting to talk and the
  // first card's own exact word with a plain crossfading topic image (see
  // PptIntroVisualFiller above) -- explicitly rejected: a lone image with no
  // card structure, not tracking the narration. Disabled outright rather
  // than reworked; the real fix is giving every slide's opening card an
  // early enough reveal offset that there's no gap left to bridge (see the
  // chapter-1 narration-coverage pass).
  const firstCardOffset = revealOffsets[0] ?? 0;
  const showIntroFiller = false &&
    /^ec[1-4]-/.test(slide.id) && cards.length > 0 && !isIntroMotion && !isConclusion &&
    started && !narrationFinished && revealedCount === 0 && narrationPosition > 0 && firstCardOffset > 60;
  const introText = showIntroFiller ? slide.narration.slice(0, firstCardOffset) : '';
  const introVisualPool = showIntroFiller ? introVisualPoolFor(slide, introText) : [];
  const introProgress = showIntroFiller ? Math.max(0, Math.min(1, narrationPosition / Math.max(1, firstCardOffset))) : 0;

  const gridClass = isThree
    ? 'grid-cols-3 grid-rows-1'
    : isTwoPanel
        ? 'grid-cols-2 grid-rows-1'
      : cards.length <= 3
        ? 'grid-cols-3 grid-rows-1'
        : cards.length === 4
          ? 'grid-cols-2 grid-rows-2'
        : 'grid-cols-3 grid-rows-2';
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
      return;
    }
    // Regular content cards: don't invent new lines — replay the exact
    // stretch of the slide's own recording where Nasser already explained
    // this card, using the alignment data to seek straight to it.
    void (async () => {
      const range = cardReplayRange(i);
      if (!range.text) return;
      const { audioAlignments } = await import('../../data/audioAlignments');
      const anchors = audioAlignments[slide.audioKey]?.anchors;
      if (anchors?.length) {
        narration.play(
          `${slide.audioKey}-card-${i}`,
          range.text,
          slide.title,
          { start: timeFromAudioAlignment(range.start, anchors), end: timeFromAudioAlignment(range.end, anchors) },
          slide.audioKey,
        );
      } else {
        guidedSpeech.speak(`${slide.audioKey}-detail-${i + 1}`, range.text, () => undefined);
      }
    })();
  };
  const expandedCardIndex = cards.findIndex((_, index) => expandedCardKey === `${slide.id}:${index}`);
  const expandedCard = expandedCardIndex >= 0 ? cards[expandedCardIndex] : undefined;
  const check = checks[0];

  // Nasser only brings up the quick check once he finishes explaining the
  // slide — never a silent card sitting next to him from the start.
  useEffect(() => {
    if (!check || checkPhase !== 'idle' || !narrationFinished) return;
    const elapsed = performance.now() - slideEnteredAtRef.current;
    const remaining = minDwellMs - elapsed;
    if (remaining > 0) {
      const timer = window.setTimeout(() => {
        // Re-check on fire: the slide may have changed, or checkPhase may
        // have advanced through some other path, in the meantime.
        if (checkPhase !== 'idle' || !narrationFinished) return;
        setCheckPhase('asking');
        const intro = CHECK_INTROS[slide.index % CHECK_INTROS.length];
        guidedSpeech.speak(`${slide.audioKey}-check-ask`, `${intro} ${check.title}`, () => setCheckPhase('ready'));
      }, remaining);
      return () => window.clearTimeout(timer);
    }
    setCheckPhase('asking');
    const intro = CHECK_INTROS[slide.index % CHECK_INTROS.length];
    guidedSpeech.speak(`${slide.audioKey}-check-ask`, `${intro} ${check.title}`, () => setCheckPhase('ready'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check, narrationFinished, checkPhase, minDwellMs]);

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
      : cardNarrationRange(expandedCardIndex).text || pptDetailFor(expandedCard, isEmergencySlide)
    : undefined);

  const actBaseIndex = actStartIndices[activeActIndex];
  const actCardCount = cardActs[activeActIndex].length;
  const displayCards = hasMultipleActs ? cardActs[activeActIndex] : cards;
  const displayActiveCard = hasMultipleActs
    ? activeCard >= actBaseIndex && activeCard < actBaseIndex + actCardCount
      ? activeCard - actBaseIndex
      : -1
    : activeCard;
  const displayVisibleFor = hasMultipleActs
    ? (i: number) => {
        const globalIndex = actBaseIndex + i;
        return i === 0 || cardIsVisible(globalIndex);
      }
    : cardIsVisible;
  const displayOnToggle = hasMultipleActs ? (i: number) => toggleCard(actBaseIndex + i) : toggleCard;
  const displayExpandedKey = hasMultipleActs
    ? expandedCardIndex >= actBaseIndex && expandedCardIndex < actBaseIndex + actCardCount
      ? `${slide.id}:${expandedCardIndex - actBaseIndex}`
      : null
    : expandedCardKey;

  // Shared by the live act and the frozen leaving-act snapshot above it --
  // same scene picked the same way, just fed different card/visibility data.
  const renderPptActScene = (
    scenelLayout: PptLayout | undefined,
    sceneCards: PptCard[],
    sceneActiveCard: number,
    sceneVisibleFor: (i: number) => boolean,
    sceneExpandedKey: string | null,
    sceneOnToggle: (i: number) => void,
  ) => {
    const revealAnimationFor = (i: number) => PPT_REVEAL_ANIMS[i % PPT_REVEAL_ANIMS.length];
    if (scenelLayout === 'pptTimeline') {
      return (
        <PptTimelineScene
          slide={slide}
          cards={sceneCards}
          activeCard={sceneActiveCard}
          visibleFor={sceneVisibleFor}
          revealAnimationFor={revealAnimationFor}
          expandedKey={sceneExpandedKey}
          onToggle={sceneOnToggle}
        />
      );
    }
    if (scenelLayout === 'pptMatrix') {
      return (
        <PptMatrixScene
          slide={slide}
          cards={sceneCards}
          activeCard={sceneActiveCard}
          visibleFor={sceneVisibleFor}
          revealAnimationFor={revealAnimationFor}
          expandedKey={sceneExpandedKey}
          onToggle={sceneOnToggle}
        />
      );
    }
    if (scenelLayout === 'pptSpotlight') {
      return (
        <PptSpotlightScene
          slide={slide}
          cards={sceneCards}
          activeCard={sceneActiveCard}
          visibleFor={sceneVisibleFor}
          revealAnimationFor={revealAnimationFor}
          expandedKey={sceneExpandedKey}
          onToggle={sceneOnToggle}
        />
      );
    }
    return (
      <PptMotionVisualScene
        slide={slide}
        layout={scenelLayout}
        cards={sceneCards}
        activeCard={sceneActiveCard}
        visibleFor={sceneVisibleFor}
        revealAnimationFor={revealAnimationFor}
        expandedKey={sceneExpandedKey}
        onToggle={sceneOnToggle}
      />
    );
  };

  // A real interactive activity (MCQ, drag-and-drop, flip cards, true/false)
  // lives as the FINAL shot of the slide, not a separate slide -- narration
  // sets up the scenario across the earlier shots, then hands off to
  // "طبّق بنفسك" for the actual interaction, all one continuous slide.
  const isActivityShot = Boolean(slide.activity) && hasMultipleActs && activeActIndex === cardActs.length - 1;
  const renderActivityShot = () => {
    const a = slide.activity;
    if (!a) return null;
    return (
      <div className="flex h-full min-h-0 flex-col items-stretch justify-center px-6 py-2">
        <ActivityChip label={slide.activityLabel ?? 'نشاط تفاعلي · طبّق بنفسك'} />
        {a.kind === 'classification' && <ClassificationActivity data={a} onDone={() => onActivityDone(slide.id)} />}
        {a.kind === 'flipCards' && <FlipCardActivity data={a} onDone={() => onActivityDone(slide.id)} />}
        {a.kind === 'scenarioDecision' && (
          <DecisionSimulation data={a} mode={slide.activityMode ?? 'both'} onDone={() => onActivityDone(slide.id)} />
        )}
        {a.kind === 'trueFalse' && <TrueFalseGame data={a} onDone={() => onActivityDone(slide.id)} />}
      </div>
    );
  };

  // Interactive checkpoints (PptContent.actActivities): some acts hand off
  // to a small interactive activity right after their OWN narration ends,
  // instead of only ever doing that once at the very end of the slide.
  // Once this act's last card has been named, narration pauses in place
  // (not stopped -- `resume()` continues the same track from that exact
  // spot) and stays paused until the learner finishes this checkpoint's
  // interaction, so "narrate a beat, then act on it" can repeat across a
  // slide instead of one long setup followed by a single interactive shot.
  //
  // This deliberately does NOT key off `activeActIndex` -- that state is
  // gated by the ~1.8s minimum-hold timer above, so it can lag well behind
  // the real (ungated) `narrationPosition` when a checkpoint act is just a
  // single short sentence. Scan every checkpoint act directly against the
  // raw narration position instead, so the pause fires exactly when that
  // act's own narration finishes, however fast the surrounding acts are.
  const checkpointEndOffsetFor = (actIndex: number) => {
    const nextStart = actStartIndices[actIndex + 1];
    if (nextStart == null) return slide.narration.length;
    return revealOffsets[nextStart] ?? slide.narration.length;
  };
  const pendingCheckpoint = (() => {
    const list = slide.ppt?.actActivities ?? [];
    for (let i = 0; i < list.length; i += 1) {
      const cp = list[i];
      if (!cp || resolvedCheckpoints.has(i)) continue;
      if (narrationPosition >= checkpointEndOffsetFor(i)) return { index: i, checkpoint: cp };
    }
    return null;
  })();
  const checkpointReached = Boolean(pendingCheckpoint);

  useEffect(() => {
    if (pendingCheckpoint && pausedCheckpointRef.current !== pendingCheckpoint.index && narration.isPlaying) {
      narration.pause();
      pausedCheckpointRef.current = pendingCheckpoint.index;
    }
  }, [pendingCheckpoint, narration]);

  const isLastCheckpointAct = (() => {
    if (!pendingCheckpoint) return false;
    const acts = slide.ppt?.actActivities ?? [];
    for (let i = acts.length - 1; i >= 0; i -= 1) {
      if (acts[i]) return i === pendingCheckpoint.index;
    }
    return false;
  })();

  const resolveCheckpoint = (resumeNarration = true) => {
    const doneIndex = pendingCheckpoint?.index;
    if (doneIndex == null) return;
    setResolvedCheckpoints((prev) => {
      if (prev.has(doneIndex)) return prev;
      const next = new Set(prev);
      next.add(doneIndex);
      return next;
    });
    pausedCheckpointRef.current = null;
    if (isLastCheckpointAct) onActivityDone(slide.id);
    if (resumeNarration) narration.resume();
  };

  // A checkpoint's activity component signals "the learner is done here" the
  // instant its own success condition is met (e.g. the moment any MCQ option
  // is picked, or the last card is flipped) -- advancing straight to the
  // next shot right then would cut the learner off before they can even see
  // Nasser's reaction or read the feedback. Only mark it *answered* on that
  // signal; a "التالي" button then appears and narration only resumes (and
  // the act actually advances) once the learner presses it themselves.
  const checkpointAnswered = pendingCheckpoint != null && answeredCheckpointIndex === pendingCheckpoint.index;
  const markCheckpointAnswered = () => {
    if (!pendingCheckpoint) return;
    if (isLastCheckpointAct) {
      resolveCheckpoint(false);
      return;
    }
    setAnsweredCheckpointIndex(pendingCheckpoint.index);
  };
  const advanceCheckpoint = () => {
    setAnsweredCheckpointIndex(null);
    resolveCheckpoint();
  };

  const renderCheckpointShot = () => {
    if (!pendingCheckpoint) return null;
    const a = pendingCheckpoint.checkpoint.activity;
    return (
      <div className="relative flex h-full min-h-0 flex-col items-stretch justify-center px-6 py-2">
        <ActivityChip label={slide.activityLabel ?? 'طبّق بنفسك'} />
        {a.kind === 'classification' && <ClassificationActivity data={a} onDone={markCheckpointAnswered} />}
        {a.kind === 'flipCards' && <FlipCardActivity data={a} onDone={markCheckpointAnswered} />}
        {a.kind === 'scenarioDecision' && (
          <DecisionSimulation data={a} mode={pendingCheckpoint.checkpoint.mode ?? 'both'} onDone={markCheckpointAnswered} />
        )}
        {a.kind === 'trueFalse' && <TrueFalseGame data={a} onDone={markCheckpointAnswered} />}
        {checkpointAnswered && (
          <button
            type="button"
            onClick={advanceCheckpoint}
            className="btn-primary animate-epic-pop absolute bottom-3 left-1/2 z-30 -translate-x-1/2 px-8 py-2.5 text-base shadow-card-lg"
          >
            التالي
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <StorySlideShell
      slide={slide}
      isActivityShot={isActivityShot || checkpointReached}
      spoken={started ? spoken : 0}
      showDialogue={showDialogue || Boolean(interactionLine)}
      dialogueOverride={interactionLine}
      revealedCount={revealedCount}
    >
      <div className="flex h-full min-h-0 flex-col px-8 py-3">
        {!isIntroMotion && <PptTitle slide={slide} showVisual={!isEmergencySlide || started || narrationPosition > 0 || narrationFinished} />}

        {showIntroFiller ? (
          <PptIntroVisualFiller pool={introVisualPool} progress={introProgress} introText={introText} />
        ) : isIntro ? (
          <IntroMotionScene slide={slide} spoken={spoken} started={motionStarted} onStart={onStart} />
        ) : isIntroRoadmap ? (
          <IntroRoadmapMotionScene slide={slide} spoken={spoken} started={motionStarted} />
        ) : isConclusion ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
            <div className={`grid w-full max-w-5xl items-stretch ${gridClass} gap-3 overflow-visible`}>
              {cards.map((card, i) => (
                <PptCardView
                  key={i}
                  card={card}
                  emoji={pptEmojiFor(card, slide.visual, i)}
                  emergencyHint={slide.id.startsWith('ec') || slide.id.startsWith('emergency')}
                  active={activeCard === i || expandedCardKey === `${slide.id}:${i}`}
                  visible={cardIsVisible(i)}
                  revealAnimation={PPT_REVEAL_ANIMS[i % PPT_REVEAL_ANIMS.length]}
                  detail={pptDetailFor(card, isEmergencySlide)}
                  reveal={expandedCardKey === `${slide.id}:${i}`}
                  onClick={() => !narrationLocked && toggleCard(i)}
                  locked={narrationLocked}
                />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={narrationLocked}
                onClick={completion.onExit}
                className={`btn-gold px-9 py-4 text-lg disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
                  narrationLocked ? '' : 'animate-pulse-ring'
                }`}
              >
                <Icon name="flag" className="h-6 w-6" />
                إنهاء والعودة للمنصة
              </button>
              <button
                type="button"
                disabled={narrationLocked}
                onClick={completion.onRestart}
                className="btn-ghost px-9 py-4 text-lg disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none"
              >
                <Icon name="flow" className="h-6 w-6" />
                إعادة الفصل
              </button>
            </div>
          </div>
        ) : (
          // A small top offset here (not on the title above, and small
          // enough to stay clear of Nasser's dialogue box fixed near the
          // bottom) keeps card content -- especially the highlighted/active
          // one -- from crowding the slide title right above it.
          <div className="relative flex min-h-0 flex-1 flex-col pt-3">
            {leavingAct && hasMultipleActs && (
              <div
                className="pointer-events-none absolute inset-0 flex min-h-0 flex-1 flex-col animate-shot-fade-out"
                aria-hidden="true"
              >
                {renderPptActScene(leavingAct.layout, leavingAct.cards, -1, () => true, null, () => undefined)}
              </div>
            )}
            <div
              key={`act-${activeActIndex}`}
              className={`relative flex min-h-0 flex-1 flex-col ${hasMultipleActs ? 'animate-shot-fade-in' : ''}`}
            >
              {checkpointReached
                ? renderCheckpointShot()
                : isActivityShot
                  ? renderActivityShot()
                  : renderPptActScene(activeLayout, displayCards, displayActiveCard, displayVisibleFor, displayExpandedKey, displayOnToggle)}
            </div>
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

function ActivityChip({ label, showVisual = true }: { label: string; showVisual?: boolean }) {
  return (
    <span className="chip mb-2 bg-brand/12 text-brand text-base font-bold">
      {showVisual && <Icon name="target" className="w-4 h-4" />}
      {label}
    </span>
  );
}

function TitleHead({ slide, showVisual = true }: { slide: Slide; showVisual?: boolean }) {
  return (
    <h2 className={`flex shrink-0 items-center text-[26px] font-extrabold leading-tight text-brand-strong animate-fade-up ${showVisual ? 'gap-2.5' : ''}`}>
      {showVisual && (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-green-500/14 p-1.5 shadow-card">
          <CourseGlyph kind={courseGlyphKind(`${slide.title} ${slide.narration}`)} compact />
        </span>
      )}
      {slide.title}
    </h2>
  );
}

function QuizStorySlide({
  slide,
  spoken,
  started,
  muted,
  showDialogue,
  onQuizComplete,
}: {
  slide: Slide;
  spoken: number;
  started: boolean;
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

  const isEmergencyQuiz = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
  const showQuizVisuals = !isEmergencyQuiz || started;
  const quizVisual = isEmergencyQuiz && started ? slideVisualPool(slide, [])[0] : undefined;
  return (
    <StorySlideShell
      slide={slide}
      spoken={spoken}
      showDialogue={showDialogue || Boolean(guidedSpeech.line)}
      dialogueOverride={guidedSpeech.line}
    >
      <div className="flex h-full flex-col p-5">
        <div className="flex shrink-0 items-center gap-3">
          <TitleHead slide={slide} showVisual={showQuizVisuals} />
          {quizVisual && (
            <span className="relative h-[56px] w-[56px] shrink-0" aria-hidden="true">
              <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,rgb(233_246_239_/_0.9),rgb(255_255_255_/_0))]" />
              <img src={quizVisual} alt="" className="absolute inset-0 h-full w-full object-contain visual-active-pulse" loading="lazy" decoding="async" />
            </span>
          )}
        </div>
        <div className="mt-1.5 flex min-h-0 w-full flex-1 flex-col overflow-visible animate-fade-in">
          <ActivityChip label={slide.activityLabel ?? 'اختبار المعرفة'} showVisual={showQuizVisuals} />
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
  const { isPlaying: narrationLocked } = useNarrationContext();
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
          <button
            type="button"
            disabled={narrationLocked}
            onClick={onStart}
            className={`btn-gold mt-8 px-9 py-4 text-lg disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
              narrationLocked ? '' : 'animate-pulse-ring'
            }`}
          >
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
      <StorySlideShell slide={slide} spoken={spoken} showDialogue={showDialogue} hideNasser>
        <div className="flex h-full flex-col p-5">
        <TitleHead slide={slide} />
        <div className="mt-1.5 min-h-0 flex-1 overflow-visible animate-fade-in">
          <ActivityChip label={slide.activityLabel ?? 'نشاط تدريبي'} />
          <div className="h-[calc(100%-2rem)] overflow-visible">
            {a.kind === 'classification' && (
              <ClassificationActivity data={a} onDone={() => onActivityDone(slide.id)} />
            )}
            {a.kind === 'flipCards' && (
              <FlipCardActivity data={a} onDone={() => onActivityDone(slide.id)} />
            )}
            {a.kind === 'scenarioDecision' && (
              <DecisionSimulation data={a} mode={slide.activityMode ?? 'both'} onDone={() => onActivityDone(slide.id)} />
            )}
            {a.kind === 'trueFalse' && (
              <TrueFalseGame data={a} onDone={() => onActivityDone(slide.id)} />
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
        started={started}
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
    const isEmergencySlide = slide.id.startsWith('ec') || slide.id.startsWith('emergency');
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
        {!isEmergencySlide && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={narrationLocked}
              onClick={completion.onExit}
              className={`btn-gold px-7 py-4 text-lg disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
                narrationLocked ? '' : 'animate-pulse-ring'
              }`}
            >
              <Icon name="flag" className="w-5 h-5" />
              إنهاء والعودة للمنصة
            </button>
            <button
              type="button"
              disabled={narrationLocked}
              onClick={completion.onRestart}
              className="btn-ghost px-7 py-4 text-lg disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none"
            >
              <Icon name="flow" className="w-5 h-5" />
              إعادة الفصل
            </button>
          </div>
        )}
      </div>
      </StorySlideShell>
    );
  }

  return null;
}
