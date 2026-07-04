export function SpeechBubble({
  label = 'ناصر',
  text,
  side = 'right',
  compact = false,
}: {
  label?: string;
  text: string;
  side?: 'left' | 'right';
  compact?: boolean;
}) {
  const tail =
    side === 'right'
      ? '-right-[16px] top-1/2 -translate-y-1/2 [clip-path:polygon(0_0,100%_50%,0_100%)]'
      : '-left-[16px] top-1/2 -translate-y-1/2 [clip-path:polygon(100%_0,0_50%,100%_100%)]';

  return (
    <div
      className={`relative min-w-[220px] rounded-2xl border-2 border-green-500/25 bg-surface px-4 py-3 text-right shadow-card animate-dialogue-pop ${
        compact ? 'max-w-[calc(100vw-132px)] sm:max-w-[430px]' : 'max-w-[calc(100vw-132px)] sm:max-w-[620px]'
      }`}
    >
      <span
        className={`absolute h-[24px] w-[18px] bg-surface drop-shadow-sm ${tail}`}
        aria-hidden="true"
      />
      <p className="mb-1 text-[13px] font-extrabold text-brand">{label}</p>
      <p className={`${compact ? 'text-[16px]' : 'text-[18px]'} font-bold leading-relaxed text-ink-soft`}>
        {text}
      </p>
    </div>
  );
}
