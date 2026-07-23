import { Icon } from '../ui/Icon';

export type Accent = 'brand' | 'sky' | 'violet' | 'amber' | 'rose' | 'emerald' | 'cyan';

interface AccentStyle {
  banner: string;
  iconBg: string;
  text: string;
  doneChip: string;
}

/** Per-activity accents, restricted to the two brand colors (green/gold) --
 *  the `Accent` keys stay as-is so existing call sites don't need to change,
 *  but every key now resolves to one of the two identity colors instead of
 *  its own distinct hue. */
export const accentStyles: Record<Accent, AccentStyle> = {
  brand: {
    banner: 'border-brand/45 bg-brand/5',
    iconBg: 'bg-brand',
    text: 'text-brand',
    doneChip: 'bg-brand/12 text-brand',
  },
  sky: {
    banner: 'border-brand/45 bg-brand/5',
    iconBg: 'bg-brand',
    text: 'text-brand',
    doneChip: 'bg-brand/12 text-brand',
  },
  violet: {
    banner: 'border-gold-400/50 bg-gold-500/[0.07]',
    iconBg: 'bg-gold-500',
    text: 'text-gold-600',
    doneChip: 'bg-gold-500/12 text-gold-600',
  },
  amber: {
    banner: 'border-gold-400/50 bg-gold-500/[0.08]',
    iconBg: 'bg-gold-500',
    text: 'text-gold-600',
    doneChip: 'bg-gold-500/15 text-gold-600',
  },
  rose: {
    banner: 'border-gold-400/50 bg-gold-500/[0.07]',
    iconBg: 'bg-gold-500',
    text: 'text-gold-600',
    doneChip: 'bg-gold-500/12 text-gold-600',
  },
  emerald: {
    banner: 'border-brand/45 bg-brand/5',
    iconBg: 'bg-brand',
    text: 'text-brand',
    doneChip: 'bg-brand/12 text-brand',
  },
  cyan: {
    banner: 'border-gold-400/50 bg-gold-500/[0.07]',
    iconBg: 'bg-gold-500',
    text: 'text-gold-600',
    doneChip: 'bg-gold-500/12 text-gold-600',
  },
};

/**
 * Wraps every training activity with an unmistakable "mission" banner and a
 * completion strip, so the learner always knows this is an interactive task.
 */
export function ActivityShell({
  instruction,
  interactionHint,
  done,
  accent = 'brand',
  children,
}: {
  instruction: string;
  interactionHint?: string;
  done: boolean;
  accent?: Accent;
  children: React.ReactNode;
}) {
  const a = accentStyles[accent];
  return (
    <div>
      <div className={`mb-5 rounded-2xl border-2 border-dashed p-4 sm:p-5 animate-scale-in ${a.banner}`}>
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-card animate-float ${a.iconBg}`}>
            <Icon name="target" className="w-6 h-6" />
          </span>
          <div>
            <p className={`text-sm font-extrabold tracking-wide ${a.text}`}>🎯 مهمتك</p>
            <p className="mt-0.5 font-semibold leading-relaxed text-ink">{instruction}</p>
            {interactionHint && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
                <Icon name="sparkles" className={`w-4 h-4 ${a.text}`} />
                {interactionHint}
              </p>
            )}
          </div>
          {done && (
            <span className={`chip ms-auto hidden shrink-0 sm:inline-flex ${a.doneChip}`}>
              <Icon name="check" className="w-4 h-4" />
              مكتمل
            </span>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
