import { useMemo, useState } from 'react';
import type { QuizData } from '../../types/course';
import { Icon } from '../ui/Icon';
import { Confetti } from '../ui/Confetti';
import { ProgressBar } from '../layout/ProgressTracker';
import { toArabicDigits } from '../../lib/utils';

export function KnowledgeCheck({
  quiz,
  onComplete,
}: {
  quiz: QuizData;
  onComplete: (scorePercent: number) => void;
}) {
  const total = quiz.questions.length;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  const q = quiz.questions[current];
  const answered = selected !== null;

  const score = useMemo(() => {
    const correct = quiz.questions.reduce(
      (acc, question) => acc + (answers[question.id] === question.correctIndex ? 1 : 0),
      0,
    );
    return { correct, percent: Math.round((correct / total) * 100) };
  }, [answers, quiz.questions, total]);

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswers((a) => ({ ...a, [q.id]: i }));
  };

  const next = () => {
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
      onComplete(score.percent);
    }
  };

  const retry = () => {
    setCurrent(0);
    setSelected(null);
    setAnswers({});
    setFinished(false);
  };

  // ---- Results ----
  if (finished) {
    const passed = score.percent >= quiz.passScore;
    return (
      <div className="relative flex h-full animate-scale-in flex-col items-center justify-center gap-3 text-center">
        {passed && <Confetti count={44} />}
        <div className={`grid h-20 w-20 place-items-center rounded-full ${passed ? 'bg-teal-500/15 text-teal-600' : 'bg-gold-500/15 text-gold-600'}`}>
          <Icon name={passed ? 'check' : 'target'} className="h-10 w-10" />
        </div>
        <p className="text-5xl font-extrabold text-ink tabular">{toArabicDigits(score.percent)}٪</p>
        <p className="text-ink-soft">
          أجبت بشكل صحيح عن {toArabicDigits(score.correct)} من {toArabicDigits(total)} أسئلة
        </p>
        <p className={`rounded-xl px-4 py-2 text-sm font-semibold ${passed ? 'bg-teal-500/10 text-teal-700' : 'bg-gold-500/10 text-gold-700'}`}>
          {passed
            ? `مبروك! اجتزت الاختبار (${toArabicDigits(quiz.passScore)}٪ فأكثر).`
            : `تحتاج ${toArabicDigits(quiz.passScore)}٪ للاجتياز — حاول مرة أخرى.`}
        </p>
        <button type="button" onClick={retry} className="btn-ghost px-6">
          <Icon name="flow" className="w-5 h-5" />
          إعادة الاختبار
        </button>
      </div>
    );
  }

  const isCorrect = selected === q.correctIndex;

  // ---- Question (fixed layout: header / options / pinned footer) ----
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-bold text-ink">
          السؤال {toArabicDigits(current + 1)} من {toArabicDigits(total)}
        </span>
        <span className="text-ink-muted">{q.source}</span>
      </div>
      <ProgressBar percent={Math.round(((current + (answered ? 1 : 0)) / total) * 100)} />

      <p className="mt-3 text-lg font-bold leading-snug text-ink">{q.prompt}</p>

      <div className="mt-3 grid flex-1 grid-cols-2 content-start gap-2.5">
        {q.options.map((opt, i) => {
          const isRight = i === q.correctIndex;
          const isSel = selected === i;
          let cls = 'border-line bg-surface hover:border-brand/40 text-ink-soft';
          if (answered) {
            if (isRight) cls = 'border-teal-500/60 bg-teal-500/10 text-teal-800';
            else if (isSel) cls = 'border-rose-400/60 bg-rose-500/10 text-rose-800';
            else cls = 'border-line bg-surface text-ink-muted opacity-60';
          }
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => choose(i)}
              className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-right text-[15px] font-semibold shadow-card transition-colors disabled:cursor-default ${cls}`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-sm font-bold tabular ${answered && isRight ? 'bg-teal-500 text-white' : answered && isSel ? 'bg-rose-500 text-white' : 'bg-surface-3 text-ink-muted'}`}>
                {answered && isRight ? <Icon name="check" className="w-4 h-4" /> : toArabicDigits(i + 1)}
              </span>
              <span className="leading-tight">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* pinned footer: feedback + next (always visible) */}
      <div className="mt-2 flex items-stretch gap-3">
        {answered ? (
          <div className={`flex flex-1 items-start gap-2 rounded-xl border px-3 py-2 text-[13px] leading-snug ${isCorrect ? 'border-teal-500/40 bg-teal-500/[0.06] text-ink' : 'border-rose-400/40 bg-rose-500/[0.06] text-ink'}`}>
            <Icon name={isCorrect ? 'check' : 'alert'} className={`mt-0.5 w-5 h-5 shrink-0 ${isCorrect ? 'text-teal-600' : 'text-rose-500'}`} />
            <span><b>{isCorrect ? 'إجابة صحيحة. ' : 'إجابة غير صحيحة. '}</b><span className="text-ink-soft">{q.explanation}</span></span>
          </div>
        ) : (
          <div className="flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 text-center text-sm text-ink-muted">
            اختر الإجابة التي تراها صحيحة
          </div>
        )}
        <button
          type="button"
          onClick={next}
          disabled={!answered}
          className="btn-primary shrink-0 self-stretch px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {current + 1 < total ? 'التالي' : 'إنهاء'}
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
