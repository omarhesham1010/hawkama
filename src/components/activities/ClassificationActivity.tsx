import { useState } from 'react';
import type { ClassificationActivityData } from '../../types/course';
import { Icon } from '../ui/Icon';
import { FeedbackBox } from '../ui/FeedbackBox';
import { toArabicDigits } from '../../lib/utils';
import { useNarrationContext } from '../audio/NarrationContext';
import { playVoiceClip } from '../../lib/playVoiceClip';

type Cat = string;

export function ClassificationActivity({
  data,
  onDone,
}: {
  data: ClassificationActivityData;
  onDone: () => void;
}) {
  const { isPlaying: narrationLocked } = useNarrationContext();
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<Cat | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [finished, setFinished] = useState(false);

  const item = data.items[index];
  const answered = choice !== null;
  const isCorrect = answered && choice === item.answer;
  const canInteract = !narrationLocked && !voicePlaying;
  const progressPercent = Math.round((index / data.items.length) * 100);

  const categoryLabel = (id: Cat) => data.categories.find((category) => category.id === id)?.label ?? id;

  const answer = (cat: Cat) => {
    if (answered || !canInteract) return;
    const ok = cat === item.answer;
    setChoice(cat);
    if (ok) setCorrectCount((count) => count + 1);
    setVoicePlaying(true);
    void playVoiceClip(item.voiceKey)
      .then(() => setVoicePlaying(false))
      .catch(() => setVoicePlaying(false));
  };

  const next = () => {
    if (index + 1 < data.items.length) {
      setIndex((current) => current + 1);
      setChoice(null);
      return;
    }
    setFinished(true);
    onDone();
  };

  if (finished) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-[28px] border border-green-700/15 bg-white/90 px-6 py-5 text-center shadow-[0_18px_34px_rgb(24_82_55_/_0.08)]">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand">
          <Icon name="target" className="h-8 w-8" />
        </div>
        <p className="mt-3 text-sm font-bold text-ink-muted">نتيجة النشاط</p>
        <p className="text-4xl font-black text-brand tabular">
          {toArabicDigits(correctCount)} / {toArabicDigits(data.items.length)}
        </p>
        <p className="mt-2 max-w-[620px] text-[16px] font-bold leading-relaxed text-ink-soft">
          اكتملت عملية التصنيف. راجع التصنيفات التي ناقشها ناصر قبل الانتقال.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 overflow-visible">
      <div className="shrink-0 rounded-2xl border border-line bg-surface-2 px-3 py-2.5 shadow-card">
        <p className="mb-1 flex items-center gap-2 text-base font-bold text-brand">
          <Icon name="gavel" className="h-5 w-5" />
          السيناريو
        </p>
        <p className="text-[14px] font-semibold leading-snug text-ink-soft">{data.scenario}</p>
      </div>

      <div className="min-h-0 flex-1 rounded-[26px] border border-green-700/15 bg-white/90 px-4 py-3 shadow-[0_18px_34px_rgb(24_82_55_/_0.08)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm font-extrabold text-brand">
            السؤال {toArabicDigits(index + 1)} من {toArabicDigits(data.items.length)}
          </span>
          <span className="text-sm font-bold text-ink-muted">صحيح: {toArabicDigits(correctCount)}</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="flex min-h-[108px] items-center justify-center rounded-2xl border border-gold-500/25 bg-gold-500/[0.06] px-5 py-4 text-center">
          <p className="text-[21px] font-black leading-relaxed text-ink">{item.text}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {data.categories.map((category) => {
            const selected = choice === category.id;
            const correct = item.answer === category.id;
            let cls = 'border-line bg-surface-2 text-ink-soft hover:border-brand/50 hover:bg-brand/5';
            if (answered) {
              if (correct) cls = 'border-green-500/60 bg-green-500/10 text-green-800';
              else if (selected) cls = 'border-rose-400/60 bg-rose-500/10 text-rose-800';
              else cls = 'border-line bg-surface-2 text-ink-muted opacity-60';
            } else if (canInteract) {
              cls += ' animate-pulse-ring';
            }
            return (
              <button
                key={category.id}
                type="button"
                disabled={answered || !canInteract}
                onClick={() => answer(category.id)}
                className={`min-h-[58px] rounded-xl border-2 px-3 py-2 text-[15px] font-extrabold leading-snug transition-colors disabled:cursor-not-allowed ${cls}`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-3 space-y-2">
            <FeedbackBox tone={isCorrect ? 'success' : 'error'} title={isCorrect ? 'تصنيف صحيح' : `التصنيف الصحيح: ${categoryLabel(item.answer)}`} className="p-3">
              <p className="text-[14px] font-semibold leading-snug">{item.rationale}</p>
            </FeedbackBox>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={voicePlaying}
                onClick={next}
                className={`btn-primary px-5 py-2.5 text-base disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted ${
                  voicePlaying ? '' : 'animate-pulse-ring'
                }`}
              >
                {index + 1 < data.items.length ? 'السؤال التالي' : 'إنهاء النشاط'}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
