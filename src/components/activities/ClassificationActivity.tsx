import { useMemo, useRef, useState } from 'react';
import type { ClassificationActivityData } from '../../types/course';
import { Icon } from '../ui/Icon';
import { useCanvasScale } from '../../lib/canvasScale';
import { toArabicDigits } from '../../lib/utils';
import { useNarrationContext } from '../audio/NarrationContext';
import { playVoiceClip } from '../../lib/playVoiceClip';

type Cat = string;

const ZONE_STYLES = [
  'border-green-500/50 bg-green-500/[0.06]',
  'border-teal-500/50 bg-teal-500/[0.06]',
] as const;
const ZONE_EMOJI = ['🏛️', '✅'] as const;

/** Real pointer-based drag & drop (mouse + touch), aware of the canvas scale. */
export function ClassificationActivity({
  data,
  onDone,
}: {
  data: ClassificationActivityData;
  onDone: () => void;
}) {
  const scale = useCanvasScale();
  const { isPlaying: narrationLocked } = useNarrationContext();
  const [assignment, setAssignment] = useState<Record<string, Cat>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const [over, setOver] = useState<Cat | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);
  const [voicePlaying, setVoicePlaying] = useState(false);

  const startRef = useRef({ x: 0, y: 0 });
  const zoneRefs = useRef<Record<Cat, HTMLDivElement | null>>({});
  const zoneIds = useMemo(() => data.categories.map((c) => c.id), [data.categories]);

  const pool = data.items.filter((it) => !assignment[it.id]);
  const correctCount = useMemo(
    () => data.items.reduce((a, it) => a + (assignment[it.id] === it.answer ? 1 : 0), 0),
    [assignment, data.items],
  );

  const zoneAt = (x: number, y: number): Cat | null => {
    for (const cat of zoneIds) {
      const el = zoneRefs.current[cat];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return cat;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (narrationLocked) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported (or synthetic event) — drag still works */
    }
    startRef.current = { x: e.clientX, y: e.clientY };
    setDragId(id);
    setDelta({ x: 0, y: 0 });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId) return;
    setDelta({ x: (e.clientX - startRef.current.x) / scale, y: (e.clientY - startRef.current.y) / scale });
    setOver(zoneAt(e.clientX, e.clientY));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragId) return;
    const cat = zoneAt(e.clientX, e.clientY);
    if (cat) {
      const item = data.items.find((it) => it.id === dragId);
      const willBeDone = Object.keys(assignment).length + 1 === data.items.length;
      setAssignment((a) => ({ ...a, [dragId]: cat }));
      setLastId(dragId);
      setVoicePlaying(true);
      void playVoiceClip(item?.voiceKey).finally(() => {
        setVoicePlaying(false);
        if (willBeDone) onDone();
      });
    }
    setDragId(null);
    setOver(null);
    setDelta({ x: 0, y: 0 });
  };

  const catLabel = (c: Cat) => data.categories.find((x) => x.id === c)?.label ?? '';
  const lastItem = data.items.find((it) => it.id === lastId);
  const lastCorrect = lastItem ? assignment[lastItem.id] === lastItem.answer : false;

  return (
    <div className="flex h-full flex-col gap-3">
      {/* scenario */}
      <p className="rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-base font-semibold leading-relaxed text-ink-soft">
        <span className="font-bold text-brand">السيناريو: </span>
        {data.scenario}
      </p>

      {/* drop zones */}
      <div className="grid grid-cols-2 gap-4">
        {data.categories.map((category, zoneIndex) => {
          const cat = category.id;
          return (
          <div
            key={cat}
            ref={(el) => (zoneRefs.current[cat] = el)}
            className={`min-h-[150px] rounded-2xl border-2 border-dashed p-3 transition-colors ${
              over === cat ? 'ring-2 ring-brand ' : ''
            }${ZONE_STYLES[zoneIndex % ZONE_STYLES.length]}`}
          >
            <p className="mb-2 flex items-center justify-center gap-2 text-lg font-extrabold text-ink">
              {ZONE_EMOJI[zoneIndex % ZONE_EMOJI.length]} {catLabel(cat)}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {data.items
                .filter((it) => assignment[it.id] === cat)
                .map((it) => {
                  const ok = it.answer === cat;
                  return (
                    <span
                      key={it.id}
                      className={`inline-flex max-w-[240px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold ${
                        ok
                          ? 'border-green-500/50 bg-green-500/10 text-green-700'
                          : 'border-rose-400/50 bg-rose-500/10 text-rose-700'
                      }`}
                    >
                      <Icon name={ok ? 'check' : 'alert'} className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{it.text}</span>
                    </span>
                  );
                })}
            </div>
          </div>
          );
        })}
      </div>

      {/* pool */}
      {pool.length > 0 ? (
        <div>
          <p className="mb-1.5 text-center text-sm font-semibold text-ink-muted">
            اسحب البطاقة إلى تصنيفها الصحيح 👇 ({toArabicDigits(pool.length)} متبقّية)
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {pool.map((it, i) => (
              <div
                key={it.id}
                onPointerDown={(e) => onPointerDown(e, it.id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{
                  touchAction: 'none',
                  transform:
                    dragId === it.id
                      ? `translate(${delta.x}px, ${delta.y}px) scale(1.04)`
                      : undefined,
                  zIndex: dragId === it.id ? 30 : undefined,
                }}
                className={`relative flex max-w-[310px] cursor-grab select-none items-center gap-2 rounded-xl border-2 bg-surface px-3 py-2 text-base font-bold text-ink shadow-card active:cursor-grabbing ${
                  dragId === it.id ? 'border-brand' : 'border-line'
                  } ${narrationLocked || voicePlaying ? 'pointer-events-none cursor-not-allowed !bg-white !text-ink-muted' : 'animate-pulse-ring'}`}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-surface-3 text-xs font-bold tabular">
                  {toArabicDigits(i + 1)}
                </span>
                {it.text}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/[0.06] px-4 py-2.5 text-center text-base font-semibold text-ink-soft">
          أحسنت! صنّفت جميع الإجراءات — إجاباتك الصحيحة{' '}
          <b className="text-brand">
            {toArabicDigits(correctCount)} من {toArabicDigits(data.items.length)}
          </b>
          .
        </div>
      )}

      {/* last feedback */}
      {lastItem && (
        <div
          className={`rounded-xl border px-4 py-2 text-base font-semibold leading-relaxed ${
            lastCorrect ? 'border-green-500/40 bg-green-500/[0.06]' : 'border-rose-400/40 bg-rose-500/[0.06]'
          }`}
        >
          <span className="font-bold">
            {lastCorrect ? '✓ ' : '✗ '}
            التصنيف المقترح: {catLabel(lastItem.answer)} —{' '}
          </span>
          <span className="text-ink-soft">{lastItem.rationale}</span>
        </div>
      )}
    </div>
  );
}
