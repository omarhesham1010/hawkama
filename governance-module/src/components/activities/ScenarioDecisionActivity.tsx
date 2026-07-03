import { useEffect, useMemo, useState } from 'react';
import type { ScenarioDecisionData } from '../../types/course';
import { Icon } from '../ui/Icon';
import { Chip, NeedsReviewTag } from '../ui/Chip';
import { FeedbackBox } from '../ui/FeedbackBox';
import { shuffle, toArabicDigits } from '../../lib/utils';

function StageTitle({ n, text }: { n: string; text: string }) {
  return (
    <h3 className="mb-3 flex items-center gap-2.5 text-lg font-bold text-ink">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white text-sm tabular">
        {n}
      </span>
      {text}
    </h3>
  );
}

export function ScenarioDecisionActivity({
  data,
  onDone,
}: {
  data: ScenarioDecisionData;
  onDone: () => void;
}) {
  const [identify, setIdentify] = useState<string | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [pathChecked, setPathChecked] = useState(false);

  const correctIds = useMemo(() => data.correctPath.map((s) => s.id), [data.correctPath]);
  const shuffledSteps = useMemo(() => shuffle(data.correctPath), [data.correctPath]);
  const pool = shuffledSteps.filter((s) => !path.includes(s.id));
  const pathFull = path.length === data.correctPath.length;
  const pathCorrect = pathFull && path.every((id, i) => id === correctIds[i]);

  const done = Boolean(identify) && pathChecked && pathCorrect;
  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);

  const stepLabel = (id: string) => data.correctPath.find((s) => s.id === id)?.label ?? '';

  return (
    <div className="space-y-8">
      {/* Scenario */}
      <div className="rounded-2xl border border-line bg-surface-2 p-5">
        <p className="mb-1 flex items-center gap-2 text-sm font-bold text-brand">
          <Icon name="gavel" className="w-5 h-5" />
          السيناريو
        </p>
        <p className="leading-loose text-ink-soft">{data.scenario}</p>
      </div>

      {/* Stage 1: Identify */}
      <div>
        <StageTitle n={toArabicDigits(1)} text="تحديد المخالفة" />
        <p className="mb-3 text-ink-soft">{data.identify.question}</p>
        <div className="flex flex-wrap gap-2">
          {data.identify.options.map((opt) => {
            const selected = identify === opt.id;
            const reveal = Boolean(identify);
            let cls = 'border-line bg-surface-2 text-ink-soft hover:border-brand/40';
            if (reveal) {
              if (opt.correct)
                cls = 'border-teal-500/50 bg-teal-500/10 text-teal-700 dark:text-teal-200';
              else if (selected)
                cls = 'border-gold-500/50 bg-gold-500/10 text-ink';
              else cls = 'border-line bg-surface-2 text-ink-muted opacity-60';
            }
            return (
              <button
                key={opt.id}
                type="button"
                disabled={reveal}
                onClick={() => setIdentify(opt.id)}
                className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-colors ${cls}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {identify && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-semibold text-ink-soft">تصنيفات ذات صلة:</span>
              {data.identify.tags.map((t) => (
                <Chip key={t} tone="navy">
                  {t}
                </Chip>
              ))}
            </div>
            <FeedbackBox tone="review" title="ملاحظة على التحديد">
              <p>{data.identify.suggestedNote}</p>
              <NeedsReviewTag className="mt-2" />
            </FeedbackBox>
          </div>
        )}
      </div>

      {/* Stage 2: Correct action path */}
      <div>
        <StageTitle n={toArabicDigits(2)} text="رتّب مسار الإجراء الصحيح" />
        <p className="mb-3 text-ink-soft">اضغط الخطوات بالترتيب الصحيح للاستجابة للحالة:</p>

        {/* ordered slots */}
        <div className="mb-3 space-y-2">
          {data.correctPath.map((_, i) => {
            const id = path[i];
            const isRight = pathChecked && id === correctIds[i];
            const isWrong = pathChecked && id && id !== correctIds[i];
            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border-2 p-3 ${
                  isRight
                    ? 'border-teal-500/50 bg-teal-500/10'
                    : isWrong
                      ? 'border-rose-400/50 bg-rose-500/10'
                      : id
                        ? 'border-line bg-surface'
                        : 'border-dashed border-line bg-surface-2'
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/12 font-bold text-brand tabular">
                  {toArabicDigits(i + 1)}
                </span>
                {id ? (
                  <>
                    <span className="flex-1 font-semibold text-ink">{stepLabel(id)}</span>
                    {!pathChecked && (
                      <button
                        type="button"
                        onClick={() => setPath((p) => p.filter((_, idx) => idx !== i))}
                        className="text-ink-muted hover:text-rose-500"
                        aria-label="إزالة"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    )}
                    {pathChecked && (
                      <Icon
                        name={isRight ? 'check' : 'alert'}
                        className={`w-5 h-5 ${isRight ? 'text-teal-600 dark:text-teal-300' : 'text-rose-500'}`}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-sm text-ink-muted">الخطوة {toArabicDigits(i + 1)}…</span>
                )}
              </div>
            );
          })}
        </div>

        {pool.length > 0 && !pathChecked && (
          <div className="flex flex-wrap gap-2">
            {pool.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPath((p) => [...p, s.id])}
                className="rounded-xl border-2 border-line bg-surface-2 px-4 py-2.5 text-sm font-bold text-ink-soft transition-all hover:border-brand/50 hover:bg-brand/5"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {!pathChecked ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setPathChecked(true)}
              disabled={!pathFull}
              className="btn-primary px-6 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="check" className="w-5 h-5" />
              تحقّق من المسار
            </button>
          </div>
        ) : pathCorrect ? (
          <FeedbackBox tone="success" title="مسار صحيح تماماً" className="mt-4">
            <p>الإفصاح، فالتنحّي عن القرار، فتوثيق الحالة، فإشراف لجنة الامتثال والأخلاقيات.</p>
          </FeedbackBox>
        ) : (
          <div className="mt-4 space-y-3">
            <FeedbackBox tone="error" title="المسار غير مرتّب بشكل صحيح.">
              <p>يبدأ الإجراء الصحيح بالإفصاح، وينتهي بإشراف لجنة الامتثال والأخلاقيات.</p>
            </FeedbackBox>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setPath([]);
                  setPathChecked(false);
                }}
                className="btn-ghost px-6"
              >
                <Icon name="flow" className="w-5 h-5" />
                إعادة الترتيب
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stage 3: Reflection (ungraded) */}
      <div>
        <StageTitle n={toArabicDigits(3)} text="نقاط للنقاش والتأمّل" />
        <div className="rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gold-600 dark:text-gold-400">
            <Icon name="sparkles" className="w-5 h-5" />
            أسئلة تأمّل مفتوحة — لا إجابة واحدة صحيحة، والهدف منها النقاش لا التقييم.
          </p>
          <div className="space-y-3">
            {data.reflection.map((q, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface p-4">
                <p className="mb-2 font-semibold text-ink">
                  {toArabicDigits(i + 1)}. {q}
                </p>
                <textarea
                  rows={2}
                  placeholder="دوّن تأمّلك هنا (اختياري)…"
                  className="w-full resize-y rounded-lg border border-line bg-surface-2 p-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {done && (
        <FeedbackBox tone="success" title="أتممت المحاكاة">
          <p>حدّدت المخالفة ورتّبت مسار الإجراء الصحيح. تأمّل نقاط النقاش قبل المتابعة.</p>
        </FeedbackBox>
      )}
    </div>
  );
}
