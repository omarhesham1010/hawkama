import { useState } from 'react';
import type { FlipCardsData } from '../../types/course';
import { Icon } from '../ui/Icon';
import { IconBadge } from '../ui/IconBadge';
import { toArabicDigits } from '../../lib/utils';
import { useNarrationContext } from '../audio/NarrationContext';
import { playVoiceClip } from '../../lib/playVoiceClip';

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
  const [voicePlaying, setVoicePlaying] = useState(false);

  const toggle = (id: string) => {
    if (narration.isPlaying || voicePlaying) return;
    const card = data.cards.find((c) => c.id === id);
    const nowFlipped = !flipped[id];
    const nextSeen = new Set(seen).add(id);
    const allSeenAfter = nextSeen.size === data.cards.length;
    setFlipped((f) => ({ ...f, [id]: nowFlipped }));
    setSeen(nextSeen);
    // When revealing the back, have Nasser read it aloud with his own
    // pre-recorded voice instead of the shared narration track -- that
    // track is mid-pause on the slide's own narration while this
    // checkpoint is open, and playing through it here would tear that down.
    if (nowFlipped && card) {
      setVoicePlaying(true);
      void playVoiceClip(card.voiceKey).finally(() => {
        setVoicePlaying(false);
        if (allSeenAfter) onDone();
      });
    } else if (allSeenAfter) {
      onDone();
    }
  };

  const seenCount = seen.size;
  const allSeen = seenCount === data.cards.length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
        {data.cards.map((card) => {
          const isFlipped = flipped[card.id];
          return (
            <button
              key={card.id}
              type="button"
              disabled={narration.isPlaying || voicePlaying}
              onClick={() => toggle(card.id)}
              className={`group h-full w-full text-right [perspective:1200px] disabled:cursor-not-allowed disabled:opacity-70 ${
                narration.isPlaying || voicePlaying ? '' : 'animate-pulse-ring'
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
          ? 'راجعت البطاقات جميعها ✓ — أنت جاهز للمحاكاة.'
          : `قلبت ${toArabicDigits(seenCount)} من ${toArabicDigits(data.cards.length)} — اقلب البقية لإكمال المراجعة.`}
      </p>
    </div>
  );
}
