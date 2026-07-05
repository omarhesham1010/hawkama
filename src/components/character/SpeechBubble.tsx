export function SpeechBubble({
  label = 'ناصر',
  text,
  tailTo = 'right',
  compact = false,
}: {
  label?: string;
  text: string;
  tailTo?: 'left' | 'right';
  compact?: boolean;
}) {
  const tail =
    tailTo === 'right'
      ? '-right-[17px] top-1/2 -translate-y-1/2 border-y-[12px] border-l-[18px] border-y-transparent border-l-surface'
      : '-left-[17px] top-1/2 -translate-y-1/2 border-y-[12px] border-r-[18px] border-y-transparent border-r-surface';

  return (
    <div
      className={`relative min-w-[220px] rounded-2xl border-2 border-green-500/25 bg-surface px-4 py-3 text-right shadow-card animate-dialogue-pop ${
        compact ? 'max-w-[430px]' : 'max-w-[620px]'
      }`}
    >
      <span className={`absolute h-0 w-0 drop-shadow-sm ${tail}`} aria-hidden="true" />
      <p className="mb-1 text-[15px] font-extrabold text-brand">{label}</p>
      <p className={`${compact ? 'text-[18px]' : 'text-[20px]'} font-bold leading-relaxed text-ink-soft`}>{text}</p>
    </div>
  );
}
