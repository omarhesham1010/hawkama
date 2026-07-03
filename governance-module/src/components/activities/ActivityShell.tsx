import { Icon } from '../ui/Icon';

export type Accent = 'brand' | 'sky' | 'violet' | 'amber' | 'rose' | 'emerald' | 'cyan';

interface AccentStyle {
  banner: string;
  iconBg: string;
  text: string;
  doneChip: string;
}

/** Cheerful per-activity accents so each game feels distinct and lively. */
export const accentStyles: Record<Accent, AccentStyle> = {
  brand: {
    banner: 'border-brand/45 bg-brand/5',
    iconBg: 'bg-brand',
    text: 'text-brand',
    doneChip: 'bg-brand/12 text-brand',
  },
  sky: {
    banner: 'border-sky-400/50 bg-sky-500/[0.07]',
    iconBg: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-300',
    doneChip: 'bg-sky-500/12 text-sky-600 dark:text-sky-300',
  },
  violet: {
    banner: 'border-violet-400/50 bg-violet-500/[0.07]',
    iconBg: 'bg-violet-500',
    text: 'text-violet-600 dark:text-violet-300',
    doneChip: 'bg-violet-500/12 text-violet-600 dark:text-violet-300',
  },
  amber: {
    banner: 'border-amber-400/50 bg-amber-500/[0.08]',
    iconBg: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-300',
    doneChip: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  },
  rose: {
    banner: 'border-rose-400/50 bg-rose-500/[0.07]',
    iconBg: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-300',
    doneChip: 'bg-rose-500/12 text-rose-600 dark:text-rose-300',
  },
  emerald: {
    banner: 'border-emerald-400/50 bg-emerald-500/[0.07]',
    iconBg: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-300',
    doneChip: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
  },
  cyan: {
    banner: 'border-cyan-400/50 bg-cyan-500/[0.07]',
    iconBg: 'bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-300',
    doneChip: 'bg-cyan-500/12 text-cyan-600 dark:text-cyan-300',
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
