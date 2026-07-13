import { useMemo, useState } from 'react';
import type { QuizData, QuizQuestion } from '../../types/course';
import { Icon } from '../ui/Icon';
import { Confetti } from '../ui/Confetti';
import { ProgressBar } from '../layout/ProgressTracker';
import { toArabicDigits } from '../../lib/utils';
import { useNarrationContext } from '../audio/NarrationContext';

export function KnowledgeCheck({
  quiz,
  onComplete,
  onAnswer,
  onAdvance,
  feedbackPending = false,
}: {
  quiz: QuizData;
  onComplete: (scorePercent: number) => void;
  onAnswer?: (question: QuizQuestion, selectedIndex: number, correct: boolean) => void;
  onAdvance?: () => void;
  feedbackPending?: boolean;
}) {
  const { isPlaying: narrationLocked } = useNarrationContext();
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
    onAnswer?.(q, i, i === q.correctIndex);
  };

  const next = () => {
    onAdvance?.();
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
      onComplete(score.percent);
    }
  };

  const retry = () => {
    onAdvance?.();
    setCurrent(0);
    setSelected(null);
    setAnswers({});
    setFinished(false);
  };

  // ---- Results ----
  if (finished) {
    const passed = score.percent >= quiz.passScore;
    return (
      <div data-quiz-result="true" className="relative flex h-full animate-scale-in flex-col items-center justify-center gap-3 text-center">
        {passed && <Confetti count={44} />}
        <div className={`grid h-20 w-20 place-items-center rounded-full ${passed ? 'bg-teal-500/15 text-teal-600' : 'bg-gold-500/15 text-gold-600'}`}>
          <Icon name={passed ? 'check' : 'target'} className="h-10 w-10" />
        </div>
        <p className="text-5xl font-extrabold text-ink tabular">{toArabicDigits(score.percent)}٪</p>
        <p className="text-lg font-semibold text-ink-soft">
          أجبت بشكل صحيح عن {toArabicDigits(score.correct)} من {toArabicDigits(total)} أسئلة
        </p>
        <p className={`rounded-xl px-4 py-2 text-base font-semibold ${passed ? 'bg-teal-500/10 text-teal-700' : 'bg-gold-500/10 text-gold-700'}`}>
          {passed
            ? `مبروك! اجتزت الاختبار (${toArabicDigits(quiz.passScore)}٪ فأكثر).`
            : `تحتاج ${toArabicDigits(quiz.passScore)}٪ للاجتياز — حاول مرة أخرى.`}
        </p>
        <button
          data-quiz-retry="true"
          type="button"
          disabled={narrationLocked}
          onClick={retry}
          className={`btn-ghost px-6 text-base disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
            narrationLocked ? '' : 'animate-pulse-ring'
          }`}
        >
          <Icon name="flow" className="w-5 h-5" />
          إعادة الاختبار
        </button>
      </div>
    );
  }

  const isCorrect = selected === q.correctIndex;

  // ---- Question (fixed layout: header / options / pinned footer) ----
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1.5 flex items-center justify-between text-base">
        <span className="font-bold text-ink">
          السؤال {toArabicDigits(current + 1)} من {toArabicDigits(total)}
        </span>
        <span className="text-ink-muted">{q.source}</span>
      </div>
      <ProgressBar percent={Math.round(((current + (answered ? 1 : 0)) / total) * 100)} />

      <p className="mt-2 rounded-2xl border border-line bg-surface-2 px-4 py-2 text-[21px] font-extrabold leading-snug text-ink shadow-card">
        {q.prompt}
      </p>

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2.5">
        {q.options.map((opt, i) => {
          const isRight = i === q.correctIndex;
          const isSel = selected === i;
          let cls = 'border-line bg-surface hover:border-brand/40 text-ink-soft';
          if (answered) {
            if (isRight) cls = 'border-teal-500/60 bg-teal-500/10 text-teal-800';
            else if (isSel) cls = 'border-rose-400/60 bg-rose-500/10 text-rose-800';
            else cls = 'border-line bg-surface text-ink-muted opacity-60';
          } else if (!narrationLocked) {
            cls += ' animate-pulse-ring';
          }
          return (
            <button
              key={i}
              data-quiz-option={i}
              type="button"
              disabled={answered || narrationLocked}
              onClick={() => choose(i)}
              className={`flex h-full items-center gap-3 rounded-2xl border-2 p-4 text-right text-[18px] font-bold leading-snug shadow-card transition-colors disabled:cursor-default ${
                !answered && narrationLocked ? '!bg-white !text-ink-muted' : ''
              } ${cls}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-base font-extrabold tabular ${answered && isRight ? 'bg-teal-500 text-white' : answered && isSel ? 'bg-rose-500 text-white' : 'bg-surface-3 text-ink-muted'}`}>
                {answered && isRight ? <Icon name="check" className="h-5 w-5" /> : toArabicDigits(i + 1)}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {/* pinned footer: feedback + next (always visible) */}
      <div className="mt-2 flex shrink-0 items-stretch gap-3">
        {answered ? (
          <div className={`flex flex-1 items-start gap-2 rounded-2xl border px-4 py-3 text-base font-semibold leading-snug ${isCorrect ? 'border-teal-500/40 bg-teal-500/[0.06] text-ink' : 'border-rose-400/40 bg-rose-500/[0.06] text-ink'}`}>
            <Icon name={isCorrect ? 'check' : 'alert'} className={`mt-0.5 h-5 w-5 shrink-0 ${isCorrect ? 'text-teal-600' : 'text-rose-500'}`} />
            <span><b>{isCorrect ? 'إجابة صحيحة. ' : 'إجابة غير صحيحة. '}</b><span className="text-ink-soft">{q.explanation}</span></span>
          </div>
        ) : (
          <div className="flex-1 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-center text-base font-semibold text-ink-muted">
            اختر الإجابة التي تراها صحيحة
          </div>
        )}
        <button
          data-quiz-next="true"
          type="button"
          onClick={next}
          disabled={!answered || feedbackPending || narrationLocked}
          className={`btn-primary min-w-[150px] shrink-0 self-stretch px-7 py-4 text-lg disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted disabled:shadow-none ${
            answered && !feedbackPending && !narrationLocked ? 'animate-pulse-ring' : ''
          }`}
        >
          {feedbackPending ? 'ناصر يناقش الإجابة' : current + 1 < total ? 'التالي' : 'إنهاء'}
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
