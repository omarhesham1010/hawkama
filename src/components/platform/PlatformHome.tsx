import { useMemo, useState } from 'react';
import { platform, type Track } from '../../data/platformContent';
import { readChapterProgress } from '../../lib/progressReader';
import { toArabicDigits } from '../../lib/utils';
import { Icon } from '../ui/Icon';
import { IconBadge } from '../ui/IconBadge';
import { ProgressBar } from '../layout/ProgressTracker';
import { BackgroundDecor } from '../course/BackgroundDecor';
import { HeroArt } from '../course/HeroArt';
import { TrackModal } from './TrackModal';

function PlatformHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-800 text-white shadow-card">
          <Icon name="shield" className="w-6 h-6" />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-ink">{platform.tagline}</p>
        </div>
      </div>
    </header>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-extrabold text-gold-600 dark:text-gold-400 tabular sm:text-3xl">
        {value}
      </p>
      <p className="text-xs text-ink-muted sm:text-sm">{label}</p>
    </div>
  );
}

function trackProgress(track: Track): number {
  if (track.status !== 'available') return 0;
  const readyChapters = track.chapters.filter((chapter) => chapter.status === 'ready');
  if (!readyChapters.length) return 0;
  const completed = readyChapters.reduce(
    (sum, chapter) => sum + (chapter.courseId ? readChapterProgress(chapter.courseId).percent : 0),
    0,
  );
  return Math.round(completed / readyChapters.length);
}

function TrackCard({ track, delayIndex, onOpen }: { track: Track; delayIndex: number; onOpen: (t: Track) => void }) {
  const available = track.status === 'available';
  const percent = trackProgress(track);
  const readyCount = track.chapters.filter((c) => c.status === 'ready').length;

  return (
    <button
      type="button"
      onClick={() => available && onOpen(track)}
      disabled={!available}
      className={`lift group relative flex flex-col overflow-hidden rounded-2xl border bg-surface p-5 text-right shadow-card animate-fade-up ${
        available
          ? 'border-gold-400/60 ring-1 ring-gold-400/40 cursor-pointer'
          : 'border-line cursor-not-allowed'
      }`}
      style={{ animationDelay: `${delayIndex * 45}ms` }}
    >
      {/* status ribbon */}
      <span
        className={`absolute left-4 top-4 chip text-[11px] font-bold ${
          available
            ? 'bg-green-500/15 text-green-700 dark:text-green-300'
            : 'bg-gold-500/15 text-gold-600 dark:text-gold-300'
        }`}
      >
        {available ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            متاح الآن
          </>
        ) : (
          <>
            <Icon name="alert" className="w-3.5 h-3.5" />
            قريباً
          </>
        )}
      </span>

      <div className="mb-3 flex items-center gap-3">
        <IconBadge icon={track.icon} tone={available ? 'brand' : 'gold'} size="md" />
      </div>

      <h3 className={`text-lg font-bold ${available ? 'text-brand-strong' : 'text-ink'}`}>
        {track.title}
      </h3>
      <p className="mt-1 mb-4 text-sm leading-relaxed text-ink-soft">{track.short}</p>

      <div className="mt-auto space-y-2">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>{toArabicDigits(track.chapters.length)} وحدات · {toArabicDigits(readyCount)} متاح</span>
          <span className="font-bold text-brand tabular">{toArabicDigits(percent)}٪</span>
        </div>
        <ProgressBar percent={percent} />
        <div
          className={`mt-2 flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold ${
            available
              ? 'bg-brand/10 text-brand group-hover:bg-brand group-hover:text-white transition-colors'
              : 'bg-surface-3 text-ink-muted'
          }`}
        >
          {available ? (
            <>
              استعرض الفصول
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 118 0v3" />
              </svg>
              مقفل — قريباً
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export function PlatformHome({
  onEnterChapter,
}: {
  onEnterChapter: (courseId: string) => void;
}) {
  const [selected, setSelected] = useState<Track | null>(null);
  const progress = useMemo(() => readChapterProgress('governance-intro'), []);
  const totalChapters = platform.tracks.reduce((sum, t) => sum + t.chapters.length, 0);

  const scrollToTracks = () =>
    document.getElementById('tracks')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="relative min-h-screen">
      <BackgroundDecor />
      <PlatformHeader />

      <main className="mx-auto max-w-6xl px-4 pb-20">
        {/* Hero */}
        <section className="grid items-center gap-8 py-10 lg:grid-cols-2 lg:py-16">
          <div className="animate-fade-up">
            <span className="chip mb-4 bg-gold-500/15 text-gold-600 dark:text-gold-300 text-sm font-bold">
              <Icon name="sparkles" className="w-4 h-4" />
              منصة تعليمية تفاعلية
            </span>
            <h1 className="text-3xl font-extrabold leading-tight text-brand-strong sm:text-4xl lg:text-5xl">
              {platform.tagline}
            </h1>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-white/85 px-4 py-2 text-base font-extrabold text-brand-strong shadow-card">
              <Icon name="shield" className="h-5 w-5 text-gold-600" />
              تحت إشراف المدرب ناصر
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{platform.intro}</p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onEnterChapter('governance-intro')}
                className="btn-gold px-7 py-3.5 text-base"
              >
                <Icon name="flag" className="w-5 h-5" />
                {progress.started ? 'تابع حقيبة الحوكمة والمخاطر' : 'ابدأ حقيبة الحوكمة والمخاطر'}
              </button>
              <button type="button" onClick={scrollToTracks} className="btn-ghost px-6 py-3.5 text-base">
                <Icon name="compass" className="w-5 h-5" />
                استعرض الحقائب
              </button>
            </div>

            {/* smart resume banner */}
            {progress.started && !progress.completed && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
                <Icon name="flow" className="w-5 h-5 text-brand" />
                <span className="text-sm text-ink-soft">
                  أكملت <b className="text-brand">{toArabicDigits(progress.percent)}٪</b> من مقدمة الحقيبة
                </span>
                <div className="ms-auto w-24">
                  <ProgressBar percent={progress.percent} />
                </div>
              </div>
            )}
            {progress.completed && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 p-3 text-sm font-semibold text-green-700 dark:text-green-300">
                <Icon name="check" className="w-5 h-5" />
                أتممت مقدمة الحقيبة — يمكنك بدء الفصل الأول من محتويات الحقيبة.
              </div>
            )}
          </div>

          <div className="order-first lg:order-last">
            <div className="card p-6 sm:p-8">
              <HeroArt className="mx-auto w-full max-w-[420px]" />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card sm:grid-cols-4">
          <Stat value={`${toArabicDigits(platform.tracks.length)}`} label="حقائب تدريبية" />
          <Stat value={`${toArabicDigits(totalChapters)}`} label="فصول تدريبية" />
          <Stat value={`${toArabicDigits(6)}+`} label="أنشطة وتطبيقات" />
          <Stat value="SCORM" label="متوافق مع أنظمة LMS" />
        </section>

        {/* Tracks */}
        <section id="tracks" className="scroll-mt-20 pt-14">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <span className="mb-1 block h-1 w-14 rounded-full bg-gold-500" />
              <h2 className="text-2xl font-bold text-brand-strong">الحقائب التدريبية</h2>
              <p className="text-sm text-ink-muted">اختر حقيبة لاستعراض محتواها</p>
            </div>
            <span className="chip bg-surface-3 text-ink-soft text-sm">
              {toArabicDigits(platform.tracks.length)} حقائب
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platform.tracks.map((track, i) => (
              <TrackCard key={track.id} track={track} delayIndex={i} onOpen={setSelected} />
            ))}
          </div>
        </section>
      </main>

      {selected && (
        <TrackModal
          track={selected}
          progress={progress}
          onClose={() => setSelected(null)}
          onEnterChapter={onEnterChapter}
        />
      )}
    </div>
  );
}
