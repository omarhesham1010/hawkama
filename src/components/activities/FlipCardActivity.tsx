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
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [finished, setFinished] = useState(false);

  const card = data.cards[index];
  const canInteract = !narration.isPlaying && !voicePlaying;

  const flip = () => {
    if (!canInteract || flipped) return;
    setFlipped(true);
    setVoicePlaying(true);
    void playVoiceClip(card.voiceKey)
      .then(() => setVoicePlaying(false))
      .catch(() => setVoicePlaying(false));
  };

  const next = () => {
    if (voicePlaying) return;
    if (index + 1 < data.cards.length) {
      setIndex((current) => current + 1);
      setFlipped(false);
      return;
    }
    setFinished(true);
    onDone();
  };

  if (finished) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-[28px] border border-green-700/15 bg-white/90 px-6 py-5 text-center shadow-[0_18px_34px_rgb(24_82_55_/_0.08)]">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand">
          <Icon name="check" className="h-8 w-8" />
        </div>
        <p className="mt-3 text-3xl font-black text-brand">راجعت البطاقات جميعها</p>
        <p className="mt-2 max-w-[620px] text-[16px] font-bold leading-relaxed text-ink-soft">
          راجعتَ كل السيناريوهات ونقاطها الرئيسية واحدًا تلو الآخر.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-sm font-extrabold text-brand">
          البطاقة {toArabicDigits(index + 1)} من {toArabicDigits(data.cards.length)}
        </span>
        <span className="text-sm font-bold text-ink-muted">{data.instruction}</span>
      </div>

      <button
        type="button"
        disabled={!canInteract || flipped}
        onClick={flip}
        className={`group min-h-0 flex-1 text-right [perspective:1200px] disabled:cursor-not-allowed ${
          canInteract && !flipped ? 'animate-pulse-ring' : ''
        }`}
        aria-pressed={flipped}
      >
        <div
          className="relative h-full w-full transition-transform duration-500 [transform:translateZ(0)]"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[28px] border border-line bg-white/92 p-6 text-center shadow-[0_20px_42px_rgb(24_82_55_/_0.1)]"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <IconBadge icon={card.icon} tone="brand" size="lg" />
            <p className="text-[30px] font-black leading-tight text-ink">{card.front}</p>
            <span className="chip bg-gold-500/12 text-gold-700 text-sm font-extrabold">
              <Icon name="sound" className="h-4 w-4" />
              اقلب واستمع
            </span>
          </div>

          <div
            className="absolute inset-0 flex flex-col justify-center gap-4 rounded-[28px] border-2 border-brand/30 bg-white/95 p-6 text-right shadow-[0_20px_42px_rgb(24_82_55_/_0.1)]"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="flex items-center gap-2 text-[22px] font-black text-brand">
              <Icon name="sound" className="h-5 w-5 animate-pulse" />
              {card.front}
            </p>
            <p className="text-[22px] font-bold leading-relaxed text-ink">{card.back}</p>
          </div>
        </div>
      </button>

      {flipped && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={voicePlaying}
            onClick={next}
            className={`btn-primary px-6 py-2.5 text-base disabled:cursor-not-allowed disabled:bg-white disabled:text-ink-muted ${
              voicePlaying ? '' : 'animate-pulse-ring'
            }`}
          >
            {index + 1 < data.cards.length ? 'البطاقة التالية' : 'إنهاء النشاط'}
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
