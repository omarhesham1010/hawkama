import type { Beat, BeatUnit, Slide } from '../../types/slides';
import { Icon } from '../ui/Icon';
import { CompletionMedallion } from '../ui/Badge';
import { Confetti } from '../ui/Confetti';
import { LessonBlockView } from '../course/LessonBlocks';
import { ClassificationActivity } from '../activities/ClassificationActivity';
import { FlipCardActivity } from '../activities/FlipCardActivity';
import { DecisionSimulation } from '../activities/DecisionSimulation';
import { KnowledgeCheck } from '../activities/KnowledgeCheck';
import { toArabicDigits } from '../../lib/utils';

export interface CompletionInfo {
  percent: number;
  quizScore: number | null;
  activitiesDone: number;
  totalActivities: number;
  onRestart: () => void;
  onExit: () => void;
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
          className={`mx-auto inline-block rounded-2xl border-2 px-6 py-3 text-center text-xl font-extrabold leading-relaxed shadow-card transition-all duration-300 ${
            active ? `${ACTIVE_BOX} text-white` : `${a.border} bg-surface text-ink`
          }`}
        >
          {unit.text}
        </p>
      );
    case 'def':
      return (
        <div className={`${shell} flex items-start gap-4 p-6`}>
          <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-4xl ${tile}`}>
            {unit.emoji}
          </span>
          <div>
            <h3 className={`mb-1 text-xl font-extrabold ${active ? 'text-white' : 'text-brand-strong'}`}>
              {unit.term}
            </h3>
            <p className={`text-[17px] leading-relaxed ${active ? 'text-green-50' : 'text-ink-soft'}`}>
              {unit.text}
            </p>
          </div>
        </div>
      );
    case 'point':
      return (
        <div className={`${shell} flex min-h-[64px] items-center gap-3.5 p-4`}>
          <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl ${tile}`}>
            {unit.emoji}
          </span>
          <div className="min-w-0">
            {unit.title && (
              <p className={`text-[17px] font-extrabold leading-tight ${active ? 'text-white' : 'text-ink'}`}>
                {unit.title}
              </p>
            )}
            {unit.text && (
              <p className={`text-[14px] leading-relaxed ${active ? 'text-green-50' : 'text-ink-soft'}`}>
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
        <div className={`min-h-[64px] rounded-2xl border-2 p-5 shadow-card transition-all duration-300 ${cls}`}>
          {unit.title && <p className={`mb-1 text-lg font-extrabold ${titleCls}`}>{unit.title}</p>}
          <p className={`text-[16px] leading-relaxed ${textCls}`}>{unit.text}</p>
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
function TargetGraphic() {
  const rings = [
    { r: 82, fill: '#63d3c9' },
    { r: 66, fill: '#149a90' },
    { r: 50, fill: '#0f6263' },
    { r: 34, fill: '#124143' },
    { r: 16, fill: '#0b1f15' },
  ];
  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[240px] animate-scale-in">
      <circle cx="110" cy="110" r="98" fill="none" stroke="#149a90" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="3 8" />
      {rings.map((ring, i) => (
        <circle key={i} cx="110" cy="110" r={ring.r} fill={ring.fill} />
      ))}
      <circle cx="110" cy="110" r="6" fill="#eef6f1" />
      {/* arrow */}
      <g>
        <line x1="176" y1="110" x2="112" y2="110" stroke="#eef6f1" strokeWidth="5" strokeLinecap="round" />
        <path d="M176 110l14-8v16z" fill="#0f6263" />
      </g>
    </svg>
  );
}

/** Always-present side graphic: an emoji "image" panel or the target. Alternates
 *  bubble shape / gradient angle per slide so consecutive slides don't look identical. */
function SideVisual({ slide, alt }: { slide: Slide; alt: boolean }) {
  return (
    <div
      className={`relative grid h-full w-[300px] shrink-0 place-items-center overflow-hidden ${
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
      {slide.visualKind === 'target' ? (
        <div className="relative">
          <TargetGraphic />
        </div>
      ) : (
        <div
          className={`relative grid h-44 w-44 place-items-center bg-white/90 text-[6rem] shadow-card-lg animate-float ring-4 ring-white/40 ${
            alt ? 'rounded-[2rem]' : 'rounded-full'
          }`}
        >
          {slide.visual}
        </div>
      )}
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

function BeatSlide({ slide, spoken }: { slide: Slide; spoken: number }) {
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
    <div className="relative grid h-28 min-w-[220px] flex-1 place-items-center overflow-hidden rounded-3xl border-2 border-green-500/30 bg-gradient-to-l from-green-500/18 via-teal-500/12 to-gold-500/14 shadow-card">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(rgb(20 160 120 / 0.35) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="relative flex items-center gap-4">
        <span className="grid h-20 w-20 place-items-center rounded-2xl bg-white/90 text-5xl shadow-card ring-4 ring-white/40">
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
    <div className="relative flex min-h-0 flex-1 flex-col justify-center gap-2.5">
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
    <div className="relative grid min-h-0 flex-1 grid-cols-2 content-center gap-3">
      <span className="absolute left-6 right-6 top-1/2 z-0 h-1 -translate-y-1/2 rounded-full bg-gradient-to-l from-green-500/55 via-teal-500/45 to-gold-500/50" />
      {flowRows}
    </div>
  );

  return (
    <div className="flex h-full flex-col px-10 py-6">
      {/* title (beat 0) */}
      <h2 className={`flex items-center gap-3 text-[28px] font-extrabold leading-tight transition-colors ${activeIdx === 0 ? 'text-brand' : 'text-brand-strong'}`}>
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
  );
}

// ---- Stage -----------------------------------------------------------------

function ActivityChip({ label }: { label: string }) {
  return (
    <span className="chip mb-3 bg-brand/12 text-brand text-sm font-bold">
      <Icon name="target" className="w-4 h-4" />
      {label}
    </span>
  );
}

function TitleHead({ slide }: { slide: Slide }) {
  return (
    <h2 className="flex items-center gap-3 text-[30px] font-extrabold leading-tight text-brand-strong animate-fade-up">
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
  onStart,
  onActivityDone,
  onQuizComplete,
  completion,
}: {
  slide: Slide;
  spoken: number;
  started: boolean;
  onStart: () => void;
  onActivityDone: (id: string) => void;
  onQuizComplete: (score: number) => void;
  completion: CompletionInfo;
}) {
  // Welcome
  if (slide.kind === 'welcome') {
    const highlights =
      slide.content?.highlights && slide.content.highlights.kind === 'points'
        ? slide.content.highlights.items
        : [];
    return (
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
        <div className="grid h-[420px] w-[420px] shrink-0 place-items-center">
          <div className="relative grid h-72 w-72 place-items-center rounded-[36px] border border-line bg-gradient-to-br from-green-500/10 via-teal-400/10 to-gold-500/14 text-[8rem] shadow-card-lg animate-float">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-green-400/18 blur-3xl" />
            <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-gold-400/18 blur-3xl" />
            🎓
          </div>
        </div>
      </div>
    );
  }

  // Content (beats)
  if (slide.kind === 'content' && slide.beats) {
    return <BeatSlide slide={slide} spoken={spoken} />;
  }

  // Activity
  if (slide.kind === 'activity' && slide.activity) {
    const a = slide.activity;
    return (
      <div className="flex h-full flex-col p-6">
        <TitleHead slide={slide} />
        <div className="mt-2 min-h-0 flex-1 overflow-hidden animate-fade-in">
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
    );
  }

  // Quiz
  if (slide.kind === 'quiz' && slide.quiz) {
    return (
      <div className="flex h-full flex-col p-7">
        <TitleHead slide={slide} />
        <div className="mt-2 flex min-h-0 w-full flex-1 flex-col overflow-hidden animate-fade-in">
          <ActivityChip label={slide.activityLabel ?? 'اختبار المعرفة'} />
          <div className="min-h-0 flex-1">
            <KnowledgeCheck quiz={slide.quiz} onComplete={onQuizComplete} />
          </div>
        </div>
      </div>
    );
  }

  // Reflection
  if (slide.kind === 'reflection' && slide.reflection) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-fade-in">
        <TitleHead slide={slide} />
        <p className="my-4 inline-flex items-center gap-2 rounded-full bg-gold-500/10 px-4 py-1.5 text-sm font-semibold text-gold-600">
          <Icon name="sparkles" className="w-5 h-5" />
          أسئلة تأمّل مفتوحة — لا إجابة واحدة صحيحة، الهدف منها النقاش لا التقييم.
        </p>
        <div className="grid w-full max-w-5xl grid-cols-3 gap-3">
          {slide.reflection.map((q, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-4 text-right shadow-card">
              <span className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-gold-500/15 text-gold-600 font-bold tabular">
                {toArabicDigits(i + 1)}
              </span>
              <p className="font-bold leading-relaxed text-ink">{q}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Completion
  if (slide.kind === 'completion') {
    return (
      <div className="relative flex h-full flex-col items-center justify-center p-10 text-center">
        <Confetti count={48} />
        <div className="mb-3 flex justify-center animate-scale-in">
          <CompletionMedallion className="h-24 w-24 animate-float" />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-strong animate-fade-up">{slide.title}</h2>
        <div className="mt-5 w-full max-w-5xl animate-fade-up text-right">
          {slide.content?.takeaways && <LessonBlockView block={slide.content.takeaways} />}
        </div>
        <div className="mt-6 flex items-center justify-center gap-8">
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
        <div className="mt-7 flex items-center justify-center gap-3">
          <button type="button" onClick={completion.onExit} className="btn-gold px-6 py-3">
            <Icon name="flag" className="w-5 h-5" />
            إنهاء والعودة للمنصة
          </button>
          <button type="button" onClick={completion.onRestart} className="btn-ghost px-6 py-3">
            <Icon name="flow" className="w-5 h-5" />
            إعادة الدورة
          </button>
        </div>
      </div>
    );
  }

  return null;
}
