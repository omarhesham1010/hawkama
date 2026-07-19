import { useEffect, useMemo, useState } from 'react';
import type { ScenarioDecisionData } from '../../types/course';
import { Icon } from '../ui/Icon';
import { Chip } from '../ui/Chip';
import { FeedbackBox } from '../ui/FeedbackBox';
import { shuffle, toArabicDigits } from '../../lib/utils';
import { useNarrationContext } from '../audio/NarrationContext';

function StageTitle({ n, text }: { n: string; text: string }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-ink">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm text-white tabular">
        {n}
      </span>
      {text}
    </h3>
  );
}

export function DecisionSimulation({
  data,
  onDone,
  mode = 'both',
}: {
  data: ScenarioDecisionData;
  onDone: () => void;
  mode?: 'both' | 'identify' | 'path';
}) {
  const { isPlaying: narrationLocked } = useNarrationContext();
  const [identify, setIdentify] = useState<string | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [pathChecked, setPathChecked] = useState(false);

  const correctIds = useMemo(() => data.correctPath.map((s) => s.id), [data.correctPath]);
  const shuffledSteps = useMemo(() => shuffle(data.correctPath), [data.correctPath]);
  const pool = shuffledSteps.filter((s) => !path.includes(s.id));
  const pathFull = path.length === data.correctPath.length;
  const pathCorrect = pathFull && path.every((id, i) => id === correctIds[i]);

  const showIdentify = mode !== 'path';
  const showPath = mode !== 'identify';
  const done = (!showIdentify || Boolean(identify)) && (!showPath || (pathChecked && pathCorrect));

  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);

  const stepLabel = (id: string) => data.correctPath.find((s) => s.id === id)?.label ?? '';
  const correctPathSummary = data.correctPath.map((s) => s.label).join('، ثم ');

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0 rounded-2xl border border-line bg-surface-2 p-3 shadow-card">
        <p className="mb-1 flex items-center gap-2 text-base font-bold text-brand">
          <Icon name="gavel" className="h-5 w-5" />
          السيناريو
        </p>
        <p className="text-[15px] font-semibold leading-snug text-ink-soft">{data.scenario}</p>
      </div>

      {showIdentify && (
        <div className="min-h-0">
          <StageTitle n={toArabicDigits(1)} text="حدد القرار الصحيح" />
          <p className="mb-2 text-base font-semibold text-ink-soft">{data.identify.question}</p>
          <div className="flex flex-wrap gap-1.5">
            {data.identify.options.map((opt) => {
              const selected = identify === opt.id;
              const reveal = Boolean(identify);
              let cls = 'border-line bg-surface-2 text-ink-soft hover:border-brand/40';
              if (reveal) {
                if (opt.correct) cls = 'border-teal-500/60 bg-teal-500/10 text-teal-800';
                else if (selected) cls = 'border-rose-400/60 bg-rose-500/10 text-rose-800';
                else cls = 'border-line bg-surface-2 text-ink-muted opacity-60';
              } else if (!narrationLocked) {
                cls += ' animate-pulse-ring';
              }
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={reveal || narrationLocked}
                  onClick={() => setIdentify(opt.id)}
                  className={`rounded-xl border-2 px-3 py-2 text-base font-bold transition-colors disabled:cursor-not-allowed ${
                    !reveal && narrationLocked ? '!bg-white !text-ink-muted' : ''
                  } ${cls}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {identify &&
            (() => {
              const chosen = data.identify.options.find((o) => o.id === identify);
              const correctOpt = data.identify.options.find((o) => o.correct);
              const ok = Boolean(chosen?.correct);
              return (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-ink-soft">تصنيفات ذات صلة:</span>
                    {data.identify.tags.map((t) => (
                      <Chip key={t} tone="navy">
                        {t}
                      </Chip>
                    ))}
                  </div>
                  <FeedbackBox
                    tone={ok ? 'success' : 'error'}
                    title={
                      ok
                        ? `إجابة صحيحة — ${correctOpt?.label}`
                        : `الإجابة الصحيحة هي: ${correctOpt?.label}`
                    }
                  >
                    <p className="text-[15px] leading-snug">{data.identify.suggestedNote}</p>
                  </FeedbackBox>
                </div>
              );
            })()}
        </div>
      )}

      {showPath && (
        <div className="min-h-0">
          <StageTitle
            n={showIdentify ? toArabicDigits(2) : toArabicDigits(1)}
            text="رتّب مسار الإجراء الصحيح"
          />
          <p className="mb-2 text-base font-semibold text-ink-soft">
            اضغط الخطوات بالترتيب الصحيح للاستجابة للحالة:
          </p>

          <div className="mb-2 grid grid-cols-2 gap-2">
            {data.correctPath.map((_, i) => {
              const id = path[i];
              const isRight = pathChecked && id === correctIds[i];
              const isWrong = pathChecked && id && id !== correctIds[i];
              return (
                <div
                  key={i}
                  className={`flex min-h-[58px] items-center gap-2 rounded-xl border-2 p-2 ${
                    isRight
                      ? 'border-teal-500/50 bg-teal-500/10'
                      : isWrong
                        ? 'border-rose-400/50 bg-rose-500/10'
                        : id
                          ? 'border-line bg-surface'
                          : 'border-dashed border-line bg-surface-2'
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/12 text-sm font-bold text-brand tabular">
                    {toArabicDigits(i + 1)}
                  </span>
                  {id ? (
                    <>
                      <span className="flex-1 text-base font-bold leading-tight text-ink">{stepLabel(id)}</span>
                      {!pathChecked && (
                        <button
                          type="button"
                          disabled={narrationLocked}
                          onClick={() => setPath((p) => p.filter((_, idx) => idx !== i))}
                          className="text-ink-muted hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="إزالة"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          >
                            <path d="M6 6l12 12M18 6L6 18" />
                          </svg>
                        </button>
                      )}
                      {pathChecked && (
                        <Icon
                          name={isRight ? 'check' : 'alert'}
                          className={`h-5 w-5 ${isRight ? 'text-teal-600' : 'text-rose-500'}`}
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-ink-muted">
                      الخطوة {toArabicDigits(i + 1)}...
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {pool.length > 0 && !pathChecked && (
            <div className="flex flex-wrap gap-1.5">
              {pool.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  disabled={narrationLocked}
                  onClick={() => setPath((p) => [...p, s.id])}
                  className={`rounded-xl border-2 border-line bg-surface-2 px-3 py-2 text-sm font-bold text-ink-soft transition-all hover:border-brand/50 hover:bg-brand/5 disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted ${
                    narrationLocked ? '' : 'animate-pulse-ring'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {!pathChecked ? (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setPathChecked(true)}
                disabled={!pathFull || narrationLocked}
                className={`btn-primary px-5 py-2 text-base disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted ${
                  pathFull && !narrationLocked ? 'animate-pulse-ring' : ''
                }`}
              >
                <Icon name="check" className="h-5 w-5" />
                تحقّق من المسار
              </button>
            </div>
          ) : pathCorrect ? (
            <FeedbackBox tone="success" title="مسار صحيح تماماً" className="mt-3">
              <p className="text-[15px] leading-snug">{correctPathSummary}</p>
            </FeedbackBox>
          ) : (
            <div className="mt-3 space-y-2">
              <FeedbackBox tone="error" title="المسار غير مرتّب بشكل صحيح.">
                <p className="text-[15px] leading-snug">الترتيب الصحيح: {correctPathSummary}</p>
              </FeedbackBox>
              <div className="flex justify-center">
                <button
                  type="button"
                  disabled={narrationLocked}
                  onClick={() => {
                    setPath([]);
                    setPathChecked(false);
                  }}
                  className={`btn-ghost px-5 py-2 text-base disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted ${
                    narrationLocked ? '' : 'animate-pulse-ring'
                  }`}
                >
                  <Icon name="flow" className="h-5 w-5" />
                  إعادة الترتيب
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
