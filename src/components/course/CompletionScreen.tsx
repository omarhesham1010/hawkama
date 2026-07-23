import { useState } from 'react';
import type { CompletionSection } from '../../types/course';
import { Icon } from '../ui/Icon';
import { CompletionMedallion } from '../ui/Badge';
import { Confetti } from '../ui/Confetti';
import { AudioNarrationButton } from '../audio/AudioNarrationButton';
import { toArabicDigits } from '../../lib/utils';

function Stat({ label, value, icon }: { label: string; value: string; icon: 'target' | 'quiz' | 'check' }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 text-center shadow-card">
      <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand">
        <Icon name={icon} className="w-5 h-5" />
      </span>
      <p className="text-2xl font-extrabold text-ink tabular">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  );
}

export function CompletionScreen({
  section,
  percent,
  quizScore,
  activitiesDone,
  totalActivities,
  onRestart,
}: {
  section: CompletionSection;
  percent: number;
  quizScore: number | null;
  activitiesDone: number;
  totalActivities: number;
  onRestart: () => void;
}) {
  const [name, setName] = useState('');

  return (
    <div className="relative mx-auto max-w-3xl animate-scale-in text-center">
      <Confetti count={48} />
      <div className="mb-4 flex justify-center">
        <CompletionMedallion className="h-32 w-32 animate-float" />
      </div>
      <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{section.title}</h1>
      <p className="mx-auto mt-3 max-w-xl leading-loose text-ink-soft">{section.intro}</p>

      {/* Stats */}
      <div className="mt-7 grid grid-cols-3 gap-3">
        <Stat label="نسبة الإتمام" value={`${toArabicDigits(percent)}٪`} icon="check" />
        <Stat
          label="نتيجة الاختبار"
          value={quizScore === null ? '—' : `${toArabicDigits(quizScore)}٪`}
          icon="quiz"
        />
        <Stat
          label="الأنشطة المكتملة"
          value={`${toArabicDigits(activitiesDone)}/${toArabicDigits(totalActivities)}`}
          icon="target"
        />
      </div>

      {/* Certificate-style card */}
      <div className="relative mt-8 overflow-hidden rounded-3xl border border-gold-500/30 bg-surface p-8 text-center shadow-card-lg">
        <div className="absolute inset-0 opacity-[0.06]" aria-hidden="true">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border-[16px] border-brand" />
          <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full border-[16px] border-gold-500" />
        </div>
        <div className="relative">
          <p className="text-sm font-semibold text-brand">شهادة إتمام تدريبي</p>
          <p className="mt-1 text-xs text-ink-muted">تشهد هذه البطاقة بإتمام وحدة</p>
          <p className="mt-2 text-lg font-bold text-ink">نماذج وهياكل الحوكمة الصحية — الفصل الأول</p>

          <div className="mx-auto mt-5 max-w-sm">
            <label htmlFor="learner-name" className="mb-1 block text-xs font-semibold text-ink-soft">
              اكتب اسمك ليظهر على الشهادة
            </label>
            <input
              id="learner-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم المتدرّب"
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-center font-bold text-ink placeholder:font-normal placeholder:text-ink-muted focus:border-brand focus:outline-none"
            />
          </div>
          {name.trim() && (
            <p className="mt-4 border-t border-dashed border-line pt-4 text-xl font-extrabold text-ink animate-fade-in">
              {name}
            </p>
          )}
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={onRestart} className="btn-ghost px-6 py-3">
          <Icon name="flow" className="w-5 h-5" />
          إعادة الوحدة
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-ghost px-6 py-3"
        >
          <Icon name="doc" className="w-5 h-5" />
          طباعة / حفظ الشهادة
        </button>
        <span className="chip bg-gold-500/12 text-gold-600 dark:text-gold-400 px-4 py-3 text-sm font-bold">
          <Icon name="flag" className="w-4 h-4" />
          الوحدة التالية — قريباً
        </span>
      </div>

      <div className="mx-auto mt-8 max-w-md">
        <AudioNarrationButton
          narrationKey={section.narrationKey}
          script={section.narration}
          label={section.navLabel}
        />
      </div>
    </div>
  );
}
