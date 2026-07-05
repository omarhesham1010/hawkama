import { useCallback, useEffect, useRef, useState } from 'react';
import type { Beat, BeatUnit, PptCard, Slide } from '../../types/slides';
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
import {
  conflictScenarioCompletion,
  conflictScenarioDiscussions,
  conflictScenarioQuestions,
  governanceFeedbackText,
  governanceQuestionText,
} from '../../data/audioScripts';

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

  const speak = useCallback(
    (audioKey: string, text: string, onComplete: () => void) => {
      setLine(text);
      completionRef.current = onComplete;
      if (muted || !narration.ttsSupported) {
        setStarted(true);
        completionRef.current = null;
        onComplete();
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
      setSpeechKey(null);
      complete?.();
    }
  }, [narration.completedKey, narration.isPlaying, narration.nowKey, speechKey]);

  const visibleLine = line && (!speechKey || started || muted || !narration.ttsSupported) ? line : undefined;

  return {
    line: visibleLine,
    speak,
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
  return side === 'left' ? 'pointLeft' : 'pointRight';
}

function tabletPose(side: 'left' | 'right'): NasserPose {
  return side === 'left' ? 'tabletLeft' : 'tabletRight';
}

function timedPose(poses: NasserPose[], index: number): NasserPose {
  return poses[Math.min(index, poses.length - 1)] ?? 'welcome';
}

function contentPose(slide: Slide, beat: Beat | undefined, beatIndex: number, side: 'left' | 'right'): NasserPose {
  const unit = beat?.unit;
  if (!unit || unit.t === 'title') return beatIndex % 2 === 0 ? 'welcome' : pointingPose(side);
  if (unit.t === 'def') return tabletPose(side);
  if (unit.t === 'callout') return unit.tone === 'contrast' ? 'success' : 'thinking';
  if ([6, 7, 8, 10, 11].includes(slide.index) && beatIndex % 2 === 0) return tabletPose(side);
  return beatIndex % 3 === 0 ? tabletPose(side) : pointingPose(side);
}

function nasserGuide(slide: Slide, spoken: number): NasserGuide {
  if (slide.layout?.startsWith('ppt')) {
    const { cue, index } = activeStoryCue(slide.narration, spoken);
    const side: 'left' | 'right' = slide.index % 2 === 0 ? 'left' : 'right';
    return {
      pose: timedPose(['welcome', pointingPose(side), tabletPose(side), 'success'], index),
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
      pose: timedPose(['welcome', pointingPose(side), tabletPose(side), 'success'], index),
      side,
      key: `welcome-${index}`,
      line: clipDialogue(cue.text, 126),
    };
  }
  if (slide.kind === 'quiz') {
    const side: 'left' | 'right' = 'left';
    return {
      pose: timedPose(['question', 'thinking', tabletPose(side), 'success'], index),
      side,
      key: `quiz-${index}`,
      line: clipDialogue(cue.text),
    };
  }
  if (slide.kind === 'reflection') {
    const side: 'left' | 'right' = 'right';
    return {
      pose: timedPose(['thinking', pointingPose(side), tabletPose(side), 'success'], index),
      side,
      key: `reflection-${index}`,
      line: clipDialogue(cue.text),
    };
  }
  if (slide.kind === 'completion') {
    const side: 'left' | 'right' = 'right';
    return {
      pose: timedPose(['completion', 'success', tabletPose(side), 'welcome'], index),
      side,
      key: `completion-${index}`,
      line: clipDialogue(cue.text, 126),
    };
  }
  if (slide.kind === 'activity') {
    const side: 'left' | 'right' = slide.activity?.kind === 'classification' ? 'right' : 'left';
    const activityPoses: NasserPose[] =
      slide.activity?.kind === 'scenarioDecision'
        ? ['warning', 'thinking', tabletPose(side), 'success']
        : slide.activity?.kind === 'flipCards'
          ? ['thinking', tabletPose(side), pointingPose(side), 'success']
          : ['question', 'thinking', tabletPose(side), 'success'];

    return {
      pose: timedPose(activityPoses, index),
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
  const isPpt = Boolean(slide.layout?.startsWith('ppt'));
  const compact = isPpt || slide.kind === 'activity' || slide.kind === 'quiz' || slide.kind === 'reflection';
  const imageSize = isPpt ? 'h-[218px] w-[218px]' : compact ? 'h-[200px] w-[200px]' : 'h-[250px] w-[250px]';
  const layerHeight = isPpt ? 'h-[190px]' : compact ? 'h-[178px]' : 'h-[212px]';
  const bottomOffset = isPpt ? 'bottom-[14px]' : 'bottom-[38px]';
  const rowDirection = guide.side === 'right' ? 'flex-row-reverse' : 'flex-row';
  const justify = guide.side === 'right' ? 'justify-end' : 'justify-start';
  const bubbleLift = compact ? 'mb-5' : 'mb-9';
  const bubbleTail = guide.side === 'right' ? 'left' : 'right';
  const displayPose = isPpt && !showDialogue ? 'welcome' : guide.pose;

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
              <SpeechBubble text={line} tailTo={bubbleTail} compact={compact} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StorySlideShell({
  slide,
  spoken,
  showDialogue,
  dialogueOverride,
  children,
}: {
  slide: Slide;
  spoken: number;
  showDialogue: boolean;
  dialogueOverride?: string;
  children: React.ReactNode;
}) {
  const isPpt = Boolean(slide.layout?.startsWith('ppt'));
  const compact = slide.kind === 'activity' || slide.kind === 'quiz' || slide.kind === 'reflection';
  const bottomSpace = isPpt ? 'pb-[232px]' : compact ? 'pb-[254px]' : 'pb-[292px]';
  const topSpace = isPpt ? 'pt-[86px]' : compact ? 'pt-[92px]' : 'pt-[106px]';

  return (
    <div className="relative h-full overflow-hidden">
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
          <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl ${tile}`}>
            {unit.emoji}
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
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl ${tile}`}>
            {unit.emoji}
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
        className={`relative grid h-36 w-36 place-items-center bg-white/90 text-[5rem] shadow-card-lg animate-float ring-4 ring-white/40 ${
          alt ? 'rounded-[2rem]' : 'rounded-full'
        }`}
      >
        {slide.visual}
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
        <span className="grid h-[72px] w-[72px] place-items-center rounded-2xl bg-white/90 text-5xl shadow-card ring-4 ring-white/40">
          {slide.visual}
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
        <span className={`grid h-14 w-14 shrink-0 place-items-center bg-gradient-to-br from-green-500 to-teal-600 text-2xl text-white shadow-card ${alt ? 'rounded-full' : 'rounded-2xl'}`}>
          {slide.visual}
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

const PPT_EMOJIS = [
  { terms: ['سيناريو'], emoji: '🎬' },
  { terms: ['مخالفة', 'خطر', 'تعارض'], emoji: '⚠️' },
  { terms: ['الإجراء الصحيح', 'صحيح'], emoji: '✅' },
  { terms: ['نقاط', 'نقاش'], emoji: '💬' },
  { terms: ['أخلاقيات', 'نزاهة', 'حياد', 'عدالة'], emoji: '⚖️' },
  { terms: ['تضارب', 'مصالح'], emoji: '⚠️' },
  { terms: ['امتثال', 'التطبيق'], emoji: '✅' },
  { terms: ['حوكمة', 'الإطار'], emoji: '🏛️' },
  { terms: ['مجلس', 'إدارة'], emoji: '🧭' },
  { terms: ['دفاع', 'مخاطر'], emoji: '🛡️' },
  { terms: ['لجان', 'لجنة'], emoji: '👥' },
  { terms: ['مصفوفة', 'صلاحيات', 'DoA'], emoji: '🗂️' },
  { terms: ['سياسات', 'وثيقة'], emoji: '📜' },
  { terms: ['إجراءات', 'ممارسة'], emoji: '⚙️' },
  { terms: ['بيانات'], emoji: '🗄️' },
  { terms: ['موارد', 'بشرية'], emoji: '👥' },
  { terms: ['تدريب', 'تقييم'], emoji: '🎓' },
  { terms: ['صحي', 'مستشفى', 'طبيب', 'أطباء', 'مرضى'], emoji: '🏥' },
  { terms: ['إفصاح'], emoji: '📣' },
  { terms: ['توثيق'], emoji: '📝' },
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

function pptDetailFor(card: PptCard) {
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

function PptTitle({ slide }: { slide: Slide }) {
  return (
    <div className="mb-4 text-center">
      {slide.ppt?.eyebrow && (
        <p className="mb-1 text-[17px] font-extrabold text-gold-600">{slide.ppt.eyebrow}</p>
      )}
      <h2 className="inline-flex items-center justify-center gap-3 text-[36px] font-extrabold leading-tight text-brand-strong">
        {slide.visual && (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-green-700/20 bg-green-700/8 text-3xl shadow-sm">
            {slide.visual}
          </span>
        )}
        <span>{slide.title}</span>
      </h2>
      {slide.ppt?.subtitle && (
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
  const tone = card.tone ?? 'green';
  const clickable = Boolean(onClick);
  const textSize = (card.title.length + (card.text?.length ?? 0) + (card.bullets?.join(' ').length ?? 0));
  const level = density ?? (textSize > 130 ? 'micro' : textSize > 110 || dense ? 'compact' : 'normal');
  const padClass = level === 'micro' ? 'p-2' : level === 'compact' ? 'p-3' : level === 'loose' ? 'p-5' : 'p-4';
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
  const emojiSize = level === 'micro' ? 'h-7 w-7 text-[19px]' : level === 'compact' ? 'h-8 w-8 text-[22px]' : 'h-10 w-10 text-[28px]';
  const activeShell = active ? 'scale-[1.025] border-green-700 bg-gradient-to-br from-green-700 to-green-600 text-white shadow-glow' : PPT_ACCENTS[tone];
  const titleTone = active ? 'text-white' : 'text-brand-strong';
  const bodyTone = active ? 'text-green-50' : 'text-ink';
  const tileTone = active ? 'border-white/30 bg-white/20 text-white shadow-card' : tone === 'gold' ? 'border-gold-500/30 bg-gold-500/12' : 'border-green-700/20 bg-green-700/8';
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
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-lg border-2 text-right shadow-sm transition-all duration-300 ${
        activeShell
      } ${visible ? revealAnimation : 'pointer-events-none opacity-0'} ${clickable && visible ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-card' : 'cursor-default'}`}
    >
      {active && <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255_/_0.22),transparent_36%)]" />}
      <span className={`relative h-1.5 w-full shrink-0 ${topBar}`} />
      <div className={`${padClass} flex min-h-0 flex-1 flex-col`}>
        <div className={`${level === 'micro' ? 'mb-1.5' : 'mb-2'} flex items-start gap-2`}>
          <span className={`grid ${emojiSize} shrink-0 place-items-center rounded-xl border ${tileTone}`}>
            {emoji}
          </span>
          {card.index && (
            <span className={`grid ${indexSize} shrink-0 place-items-center rounded-full font-extrabold tabular ${active ? 'bg-white/20 text-white ring-2 ring-white/25' : 'bg-green-700 text-white'}`}>
              {card.index}
            </span>
          )}
          <h3 className={`${showAnswerDetail ? 'text-[18px] leading-tight' : titleClass} font-extrabold ${titleTone}`}>
            {showAnswerDetail ? `التصنيف: ${card.answer}` : card.title}
          </h3>
        </div>

        {showTrainingDetail ? (
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

        {clickable && !card.answer && (
          <span className={`mt-auto inline-grid h-6 w-6 place-items-center self-end rounded-full text-[15px] font-extrabold ${active ? 'bg-white/20 text-white' : 'bg-green-700/10 text-green-800'}`}>
            {showTrainingDetail ? '↩' : '+'}
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
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_220px] gap-3">
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
  const fallbackInteractionLine = complete
    ? conflictScenarioCompletion
    : revealed && currentCard
      ? discussions[step]
      : ready
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

  if (slide.layout === 'pptActivitySort') {
    return <PptActivitySlide slide={slide} spoken={spoken} muted={muted} showDialogue={showDialogue} onActivityDone={onActivityDone} />;
  }
  if (slide.layout === 'pptScenario') {
    return <PptGuidedScenarioSlide slide={slide} spoken={spoken} muted={muted} showDialogue={showDialogue} onActivityDone={onActivityDone} />;
  }

  const cards = slide.ppt?.cards ?? [];
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
  const isIntro = slide.layout === 'pptIntro';
  const isConclusion = slide.layout === 'pptConclusion';
  const isThree = slide.layout === 'pptThreeColumns';
  const isTwoPanel = slide.layout === 'pptTwoPanels';
  const dense = slide.layout === 'pptThreeColumns' || slide.layout === 'pptSixCards' || slide.layout === 'pptTitleCards';

  const gridClass = isThree
    ? 'grid-cols-3 grid-rows-1'
    : isTwoPanel
        ? 'grid-cols-2 grid-rows-1'
      : cards.length <= 3
        ? 'grid-cols-3 grid-rows-1'
        : 'grid-cols-3 grid-rows-2';
  const cardDensity: 'loose' | 'normal' | 'compact' | 'micro' | undefined =
    slide.layout === 'pptThreeColumns'
      ? 'compact'
      : isTwoPanel
        ? 'normal'
          : undefined;
  const toggleCard = (i: number) => {
    const key = `${slide.id}:${i}`;
    setExpandedCardKey((current) => (current === key ? null : key));
  };
  const expandedCardIndex = cards.findIndex((_, index) => expandedCardKey === `${slide.id}:${index}`);
  const expandedCard = expandedCardIndex >= 0 ? cards[expandedCardIndex] : undefined;
  const interactionLine = expandedCard
    ? `خلنا نربط هذه النقطة بالتطبيق: ${pptDetailFor(expandedCard)} فكر كيف تظهر في بيئة عملك قبل الانتقال للنقطة التالية.`
    : undefined;

  return (
    <StorySlideShell
      slide={slide}
      spoken={started ? spoken : 0}
      showDialogue={showDialogue || Boolean(interactionLine)}
      dialogueOverride={interactionLine}
    >
      <div className="flex h-full min-h-0 flex-col px-8 py-3">
        <PptTitle slide={slide} />

        {isIntro ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="w-full max-w-4xl rounded-lg border-2 border-green-700/25 bg-white/95 p-8 text-center shadow-sm">
              <p className="text-[26px] font-extrabold leading-relaxed text-brand-strong">{slide.ppt?.intro}</p>
              <button type="button" onClick={onStart} className="btn-gold mt-7 px-9 py-4 text-lg">
                <Icon name="flag" className="h-6 w-6" />
                {started ? 'استمع للمقدمة' : 'ابدأ الفصل'}
              </button>
            </div>
          </div>
        ) : isConclusion ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
            <div className={`grid w-full max-w-5xl auto-rows-fr ${gridClass} gap-3`}>
              {cards.map((card, i) => (
                <PptCardView
                  key={i}
                  card={card}
                  density="normal"
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
            <div className="mt-4 flex items-center justify-center gap-3">
              <button type="button" onClick={completion.onExit} className="btn-gold px-7 py-3 text-base">
                <Icon name="flag" className="h-5 w-5" />
                إنهاء والعودة للمنصة
              </button>
              <button type="button" onClick={completion.onRestart} className="btn-ghost px-7 py-3 text-base">
                <Icon name="flow" className="h-5 w-5" />
                إعادة الفصل
              </button>
            </div>
          </div>
        ) : (
          <div className={`grid min-h-0 flex-1 auto-rows-fr ${gridClass} gap-3`}>
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
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-green-500/12 to-gold-500/16 text-3xl shadow-card">
        {slide.visual}
      </span>
      {slide.title}
    </h2>
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
      <StorySlideShell slide={slide} spoken={spoken} showDialogue={showDialogue}>
        <div className="flex h-full flex-col p-7">
        <TitleHead slide={slide} />
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden animate-fade-in">
          <ActivityChip label={slide.activityLabel ?? 'اختبار المعرفة'} />
          <div className="min-h-0 flex-1">
            <KnowledgeCheck quiz={slide.quiz} onComplete={onQuizComplete} />
          </div>
        </div>
      </div>
      </StorySlideShell>
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
        <div className="relative flex h-full flex-col items-center justify-center p-10 text-center">
        <Confetti count={48} />
        <div className="mb-2 flex justify-center animate-scale-in">
          <CompletionMedallion className="h-20 w-20 animate-float" />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-strong animate-fade-up">{slide.title}</h2>
        <div className="mt-4 w-full max-w-5xl animate-fade-up text-right">
          {slide.content?.takeaways && <LessonBlockView block={slide.content.takeaways} />}
        </div>
        <div className="mt-4 flex items-center justify-center gap-8">
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
        <div className="mt-4 flex -translate-y-20 items-center justify-center gap-3">
          <button type="button" onClick={completion.onExit} className="btn-gold px-7 py-4 text-lg">
            <Icon name="flag" className="w-5 h-5" />
            إنهاء والعودة للمنصة
          </button>
          <button type="button" onClick={completion.onRestart} className="btn-ghost px-7 py-4 text-lg">
            <Icon name="flow" className="w-5 h-5" />
            إعادة الدورة
          </button>
        </div>
      </div>
      </StorySlideShell>
    );
  }

  return null;
}
