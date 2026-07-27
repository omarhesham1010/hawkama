import { useEffect, useState } from 'react';
import type { TrueFalseData } from '../../../types/course';
import { Icon } from '../ui/Icon';
import { FeedbackBox } from '../../../components/ui/FeedbackBox';
import { Confetti } from '../ui/Confetti';
import { ProgressBar } from '../../../components/layout/ProgressTracker';
import { toArabicDigits } from '../../../lib/utils';

export function TrueFalseGame({
  data,
  onDone,
}: {
  data: TrueFalseData;
  onDone: () => void;
}) {
  const total = data.statements.length;
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);

  const stmt = data.statements[index];
  const answered = choice !== null;
  const isCorrect = answered && choice === stmt.answer;

  useEffect(() => {
    if (finished) onDone();
  }, [finished, onDone]);

  const answer = (val: boolean) => {
    if (answered) return;
    setChoice(val);
    if (val === stmt.answer) {
      setCorrectCount((c) => c + 1);
      setStreak((s) => {
        const ns = s + 1;
        setBestStreak((b) => Math.max(b, ns));
        return ns;
      });
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setChoice(null);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setIndex(0);
    setChoice(null);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
  };

  if (finished) {
    const perfect = correctCount === total;
    return (
      <div className="relative animate-scale-in space-y-5 text-center">
        {perfect && <Confetti count={40} />}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
          <Icon name="target" className="h-10 w-10" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-muted">نتيجتك في اللعبة</p>
          <p className="text-4xl font-extrabold text-ink tabular">
            {toArabicDigits(correctCount)}/{toArabicDigits(total)}
          </p>
          <p className="mt-1 text-ink-soft">
            أطول سلسلة صحيحة: <b className="text-amber-600 dark:text-amber-400">{toArabicDigits(bestStreak)}</b> 🔥
          </p>
        </div>
        <FeedbackBox tone={perfect ? 'success' : 'info'} title={perfect ? 'ممتاز! إجابات كاملة 🎉' : 'أحسنت — راجع ما فاتك ثم انتقل للاختبار.'}>
          <p>هذه اللعبة إحماء سريع؛ اختبار المعرفة التالي يمنحك النتيجة المعتمدة.</p>
        </FeedbackBox>
        <button type="button" onClick={restart} className="btn-ghost mx-auto px-6">
          <Icon name="flow" className="w-5 h-5" />
          إعادة اللعبة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* header: progress + streak */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-bold text-ink">
              العبارة {toArabicDigits(index + 1)} من {toArabicDigits(total)}
            </span>
            <span className="text-ink-muted">صحيح: {toArabicDigits(correctCount)}</span>
          </div>
          <ProgressBar percent={Math.round((index / total) * 100)} />
        </div>
        <span
          className={`chip shrink-0 text-sm font-bold ${
            streak > 1 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300' : 'bg-surface-3 text-ink-muted'
          }`}
        >
          🔥 {toArabicDigits(streak)}
        </span>
      </div>

      {/* statement card */}
      <div className="card flex min-h-[140px] items-center justify-center p-6 text-center">
        <p className="text-xl font-bold leading-relaxed text-ink">{stmt.text}</p>
      </div>

      {/* true / false buttons */}
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((val) => {
          const label = val ? 'صواب' : 'خطأ';
          const isThis = choice === val;
          const showCorrect = answered && stmt.answer === val;
          let cls = val
            ? 'border-greenLegacy-500/40 bg-greenLegacy-500/5 text-greenLegacy-700 dark:text-greenLegacy-300 hover:bg-greenLegacy-500/10'
            : 'border-rose-400/40 bg-rose-500/5 text-rose-700 dark:text-rose-300 hover:bg-rose-500/10';
          if (answered) {
            if (showCorrect) cls = 'border-greenLegacy-500/60 bg-greenLegacy-500/15 text-greenLegacy-700 dark:text-greenLegacy-200';
            else if (isThis) cls = 'border-rose-400/60 bg-rose-500/15 text-rose-700 dark:text-rose-200';
            else cls = 'border-line bg-surface-2 text-ink-muted opacity-60';
          }
          return (
            <button
              key={label}
              type="button"
              disabled={answered}
              onClick={() => answer(val)}
              className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-5 text-lg font-extrabold transition-all disabled:cursor-default ${cls}`}
            >
              <Icon name={val ? 'check' : 'alert'} className="w-6 h-6" />
              {label}
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          <FeedbackBox tone={isCorrect ? 'success' : 'error'} title={isCorrect ? 'إجابة صحيحة ✓' : 'إجابة غير صحيحة'}>
            <p>{stmt.explanation}</p>
          </FeedbackBox>
          <div className="flex justify-end">
            <button type="button" onClick={next} className="btn-primary px-6">
              {index + 1 < total ? 'العبارة التالية' : 'إنهاء اللعبة'}
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
