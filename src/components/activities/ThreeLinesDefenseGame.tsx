import { useMemo, useState } from 'react';
import type { ThreeLinesActivityData } from '../../types/course';
import { Icon } from '../ui/Icon';
import { FeedbackBox } from '../ui/FeedbackBox';
import { shuffle, toArabicDigits } from '../../lib/utils';

interface Role {
  id: string;
  text: string;
}

export function ThreeLinesDefenseGame({
  data,
  onDone,
}: {
  data: ThreeLinesActivityData;
  onDone: () => void;
}) {
  const roles: Role[] = useMemo(
    () => shuffle(data.slots.map((s) => ({ id: s.id, text: s.role }))),
    [data.slots],
  );

  const [assignment, setAssignment] = useState<Record<string, string | null>>(
    Object.fromEntries(data.slots.map((s) => [s.id, null])),
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const assignedRoleIds = Object.values(assignment).filter(Boolean) as string[];
  const pool = roles.filter((r) => !assignedRoleIds.includes(r.id));
  const allFilled = data.slots.every((s) => assignment[s.id]);
  const allCorrect = data.slots.every((s) => assignment[s.id] === s.id);

  const placeInSlot = (slotId: string) => {
    if (checked) return;
    if (assignment[slotId]) {
      // remove existing → back to pool
      setAssignment((a) => ({ ...a, [slotId]: null }));
      return;
    }
    if (!selected) return;
    setAssignment((a) => ({ ...a, [slotId]: selected }));
    setSelected(null);
  };

  const roleText = (roleId: string | null) =>
    roleId ? roles.find((r) => r.id === roleId)?.text ?? '' : '';

  const check = () => {
    setChecked(true);
    if (allCorrect) onDone();
  };

  const reset = () => {
    setAssignment(Object.fromEntries(data.slots.map((s) => [s.id, null])));
    setSelected(null);
    setChecked(false);
  };

  return (
    <div className="space-y-5">
      {/* Role pool */}
      <div>
        <p className="mb-2 text-sm font-bold text-ink-soft">الأدوار المتاحة — اختر دوراً ثم ضعه في خطه:</p>
        <div className="flex flex-wrap gap-2 rounded-2xl border border-dashed border-line bg-surface-2 p-3 min-h-[64px]">
          {pool.length === 0 && (
            <span className="px-2 py-2 text-sm text-ink-muted">تم وضع جميع الأدوار ✓</span>
          )}
          {pool.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected((s) => (s === r.id ? null : r.id))}
              className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                selected === r.id
                  ? 'border-brand bg-brand text-white shadow-glow scale-105'
                  : 'border-line bg-surface text-ink-soft hover:border-brand/40'
              }`}
            >
              {r.text}
            </button>
          ))}
        </div>
      </div>

      {/* Line slots */}
      <div className="space-y-3">
        {data.slots.map((slot, i) => {
          const roleId = assignment[slot.id];
          const isRight = checked && roleId === slot.id;
          const isWrong = checked && roleId && roleId !== slot.id;
          return (
            <div
              key={slot.id}
              className={`flex items-center gap-4 rounded-2xl border-2 p-4 transition-colors ${
                isRight
                  ? 'border-teal-500/50 bg-teal-500/10'
                  : isWrong
                    ? 'border-rose-400/50 bg-rose-500/10'
                    : 'border-line bg-surface'
              }`}
              style={{ marginInlineStart: `${i * 6}%` }}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white font-bold tabular">
                {toArabicDigits(i + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-brand">{slot.label}</p>
                <p className="text-sm text-ink-muted">{slot.hint}</p>
              </div>
              <button
                type="button"
                onClick={() => placeInSlot(slot.id)}
                className={`min-w-[130px] rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-colors ${
                  roleId
                    ? 'border-transparent bg-surface-3 text-ink'
                    : selected
                      ? 'border-brand/60 border-dashed bg-brand/5 text-brand'
                      : 'border-line border-dashed bg-surface-2 text-ink-muted'
                }`}
              >
                {roleId ? roleText(roleId) : selected ? 'ضع هنا' : 'اختر الدور'}
              </button>
              {checked && (
                <Icon
                  name={isRight ? 'check' : 'alert'}
                  className={`w-6 h-6 shrink-0 ${isRight ? 'text-teal-600 dark:text-teal-300' : 'text-rose-500'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Actions + feedback */}
      {!checked ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={check}
            disabled={!allFilled}
            className="btn-primary px-6 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="check" className="w-5 h-5" />
            تحقّق من الإجابة
          </button>
        </div>
      ) : allCorrect ? (
        <FeedbackBox tone="success" title="ممتاز! رتّبت خطوط الدفاع الثلاثة بشكل صحيح.">
          <p>الخط الأول للتنفيذ، والثاني للمخاطر والامتثال، والثالث للتدقيق الداخلي المستقل.</p>
        </FeedbackBox>
      ) : (
        <div className="space-y-3">
          <FeedbackBox tone="error" title="ليس تماماً — راجع مواضع الأدوار وحاول مجدداً.">
            <p>تذكّر: التنفيذ اليومي أولاً، ثم إدارة المخاطر والامتثال، ثم التدقيق المستقل.</p>
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
