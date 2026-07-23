import { useMemo, useState } from 'react';
import type { FrameworkBuilderData } from '../../types/course';
import { Icon } from '../ui/Icon';
import { IconBadge } from '../ui/IconBadge';
import { FeedbackBox } from '../ui/FeedbackBox';
import { shuffle, toArabicDigits } from '../../lib/utils';

export function GovernanceFrameworkBuilder({
  data,
  onDone,
}: {
  data: FrameworkBuilderData;
  onDone: () => void;
}) {
  const shuffledPool = useMemo(() => shuffle(data.pieces), [data.pieces]);
  const [built, setBuilt] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  const pool = shuffledPool.filter((p) => !built.includes(p.id));
  const full = built.length === data.pieces.length;
  const correctOrder = data.pieces.map((p) => p.id);
  const allCorrect = built.every((id, i) => id === correctOrder[i]) && full;

  const pieceById = (id: string) => data.pieces.find((p) => p.id === id)!;

  const add = (id: string) => {
    if (checked) return;
    setBuilt((b) => [...b, id]);
  };
  const removeAt = (index: number) => {
    if (checked) return;
    setBuilt((b) => b.filter((_, i) => i !== index));
  };
  const check = () => {
    setChecked(true);
    if (allCorrect) onDone();
  };
  const reset = () => {
    setBuilt([]);
    setChecked(false);
  };

  return (
    <div className="space-y-5">
      {/* Building chain */}
      <div>
        <p className="mb-2 text-sm font-bold text-ink-soft">سلسلة الحوكمة (من التوجيه إلى الممارسة):</p>
        <div className="space-y-2">
          {data.pieces.map((_, i) => {
            const id = built[i];
            const piece = id ? pieceById(id) : null;
            const isRight = checked && id === correctOrder[i];
            const isWrong = checked && id && id !== correctOrder[i];
            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                  isRight
                    ? 'border-green-500/50 bg-green-500/10'
                    : isWrong
                      ? 'border-rose-400/50 bg-rose-500/10'
                      : piece
                        ? 'border-line bg-surface'
                        : 'border-dashed border-line bg-surface-2'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/12 font-bold text-brand tabular">
                  {toArabicDigits(i + 1)}
                </span>
                {piece ? (
                  <>
                    <IconBadge icon={piece.icon} tone="soft" size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink text-sm">{piece.title}</p>
                      <p className="text-xs text-ink-muted">{piece.role}</p>
                    </div>
                    {!checked && (
                      <button
                        type="button"
                        onClick={() => removeAt(i)}
                        className="text-ink-muted hover:text-rose-500"
                        aria-label="إزالة"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    )}
                    {checked && (
                      <Icon
                        name={isRight ? 'check' : 'alert'}
                        className={`w-5 h-5 ${isRight ? 'text-green-600 dark:text-green-300' : 'text-rose-500'}`}
                      />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-ink-muted">المكوّن رقم {toArabicDigits(i + 1)}…</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pool */}
      {pool.length > 0 && !checked && (
        <div>
          <p className="mb-2 text-sm font-bold text-ink-soft">اضغط المكوّن التالي في السلسلة:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {pool.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => add(p.id)}
                className="flex items-center gap-3 rounded-xl border-2 border-line bg-surface-2 p-3 text-right transition-all hover:border-brand/50 hover:bg-brand/5"
              >
                <IconBadge icon={p.icon} tone="brand" size="sm" />
                <div className="min-w-0">
                  <p className="font-bold text-ink text-sm">{p.title}</p>
                  <p className="text-xs text-ink-muted">{p.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions + feedback */}
      {!checked ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={check}
            disabled={!full}
            className="btn-primary px-6 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="check" className="w-5 h-5" />
            تحقّق من الترتيب
          </button>
        </div>
      ) : allCorrect ? (
        <FeedbackBox tone="success" title="رائع! بنيت إطار الحوكمة بالتسلسل الصحيح.">
          <p>المجلس يوجّه، فاللجان تحلّل وتوصي، فمصفوفة الصلاحيات تضبط، فالسياسات تحدد الالتزام، فالإجراءات تترجمه ممارسةً.</p>
        </FeedbackBox>
      ) : (
        <div className="space-y-3">
          <FeedbackBox tone="error" title="الترتيب غير مكتمل الصحة — تأمّل التسلسل من الأعلى إلى التطبيق.">
            <p>ابدأ بمن يوجّه (المجلس)، وانتهِ بما يترجم الالتزام إلى ممارسة يومية (الإجراءات).</p>
          </FeedbackBox>
          <div className="flex justify-center">
            <button type="button" onClick={reset} className="btn-ghost px-6">
              <Icon name="flow" className="w-5 h-5" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
