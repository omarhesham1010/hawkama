import { useEffect, useState } from 'react';
import type { FlipCardsData } from '../../types/course';
import { Icon } from '../ui/Icon';
import { IconBadge } from '../ui/IconBadge';
import { toArabicDigits } from '../../lib/utils';
import { useNarrationContext } from '../audio/NarrationContext';

export function FlipCardActivity({
  data,
  onDone,
}: {
  data: FlipCardsData;
  onDone: () => void;
}) {
  const narration = useNarrationContext();
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const card = data.cards.find((c) => c.id === id);
    const nowFlipped = !flipped[id];
    setFlipped((f) => ({ ...f, [id]: nowFlipped }));
    setSeen((s) => new Set(s).add(id));
    // When revealing the back, read its definition aloud automatically.
    if (nowFlipped && card) {
      narration.play(`card-${id}`, `${card.front}. ${card.back}`, card.front);
    } else {
      narration.stop();
    }
  };

  const seenCount = seen.size;
  const allSeen = seenCount === data.cards.length;

  useEffect(() => {
    if (allSeen) onDone();
  }, [allSeen, onDone]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
        {data.cards.map((card) => {
          const isFlipped = flipped[card.id];
          return (
            <button
              key={card.id}
              type="button"
              disabled={narration.isPlaying}
              onClick={() => toggle(card.id)}
              className={`group h-full w-full text-right [perspective:1200px] disabled:cursor-not-allowed disabled:opacity-40 disabled:grayscale ${
                narration.isPlaying ? '' : 'animate-pulse-ring'
              }`}
              aria-pressed={isFlipped}
            >
              <div
                className="relative h-full w-full transition-transform duration-500 [transform:translateZ(0)]"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-surface p-3 text-center shadow-card"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                >
                  <IconBadge icon={card.icon} tone="brand" size="md" />
                  <p className="text-[19px] font-extrabold leading-tight text-ink">{card.front}</p>
                  <span className="chip bg-surface-3 text-ink-muted text-xs">
                    <Icon name="sound" className="w-4 h-4" />
                    اقلب واستمع
                  </span>
                </div>
                {/* Back */}
                <div
                  className="absolute inset-0 flex flex-col justify-center gap-1.5 rounded-2xl border-2 border-brand/30 bg-surface p-3 text-right shadow-card"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <p className="flex items-center gap-1.5 text-[16px] font-extrabold text-brand">
                    <Icon name="sound" className="w-4 h-4 animate-pulse" />
                    {card.front}
                  </p>
                  <p className="text-[15.5px] font-semibold leading-snug text-ink">{card.back}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p
        className={`shrink-0 rounded-xl px-3 py-1.5 text-center text-sm font-semibold ${
          allSeen ? 'bg-green-500/10 font-semibold text-green-700' : 'text-ink-muted'
        }`}
      >
        {allSeen
          ? 'راجعت البطاقات الست جميعها ✓ — أنت جاهز للمحاكاة.'
          : `قلبت ${toArabicDigits(seenCount)} من ${toArabicDigits(data.cards.length)} — اقلب البقية لإكمال المراجعة.`}
      </p>
    </div>
  );
}
