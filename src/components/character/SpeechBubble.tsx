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
  const tail = side === 'right' ? 'right-5 border-l-surface' : 'left-5 border-r-surface';

  return (
    <div
      className={`relative min-w-[220px] rounded-2xl border-2 border-green-500/25 bg-surface px-4 py-3 text-right shadow-card animate-dialogue-pop ${
        compact ? 'max-w-[300px]' : 'max-w-[430px]'
      }`}
    >
      <span
        className={`absolute -bottom-3 h-0 w-0 border-y-[10px] border-y-transparent ${
          side === 'right' ? 'border-l-[16px]' : 'border-r-[16px]'
        } ${tail}`}
        aria-hidden="true"
      />
      <p className="mb-1 text-[13px] font-extrabold text-brand">{label}</p>
      <p className={`${compact ? 'text-[16px]' : 'text-[18px]'} font-bold leading-relaxed text-ink-soft`}>
        {text}
      </p>
    </div>
  );
}
