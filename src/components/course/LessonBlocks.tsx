import type { CompareBlock, LessonBlock } from '../../types/course';
import { Icon } from '../ui/Icon';
import { IconBadge } from '../ui/IconBadge';
import { Diagram } from './Diagrams';

function CompareBoard({ block }: { block: CompareBlock }) {
  return (
    <div>
      {block.subtitle && (
        <p className="mb-5 text-center">
          <span className="chip bg-gold-500/15 text-gold-600 dark:text-gold-300 text-base font-bold px-4 py-1.5">
            « {block.subtitle} »
          </span>
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {block.columns.map((col, colIndex) => {
          // Column ٣ (integration) is gold, like the PPT; the rest are green.
          const gold = col.index === '٣';
          const headerBg = gold
            ? 'bg-gradient-to-l from-gold-600 to-gold-500'
            : 'bg-gradient-to-l from-green-700 to-green-600';
          const dot = gold ? 'bg-gold-500' : 'bg-green-600 dark:bg-green-400';
          const topLine = gold ? 'bg-gold-500' : 'bg-green-600';
          return (
            <div
              key={col.index}
              className="lift flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card animate-fade-up"
              style={{ animationDelay: `${colIndex * 90}ms` }}
            >
              {/* PPT-style solid header */}
              <div className={`flex items-center gap-3 px-4 py-3.5 text-white ${headerBg}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95 font-extrabold tabular text-green-800">
                  {col.index}
                </span>
                <h4 className="flex-1 font-bold leading-tight">{col.heading}</h4>
                <Icon name={col.icon} className="w-6 h-6 opacity-90" />
              </div>

              {/* White body */}
              <div className="flex flex-1 flex-col p-4">
                <span className={`mb-3 h-1 w-14 rounded-full ${topLine}`} />
                <p className="mb-3 text-center text-sm font-medium italic text-ink-muted">
                  {col.tagline}
                </p>
                <ul className="space-y-2.5">
                  {col.points.map((p, i) => (
                    <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LessonBlockView({ block }: { block: LessonBlock }) {
  switch (block.kind) {
    case 'lead':
      return <p className="text-[15px] leading-relaxed text-ink-soft">{block.text}</p>;

    case 'definition':
      return (
        <div className="card p-6 shadow-card">
          <div className="flex items-start gap-4">
            {block.icon && <IconBadge icon={block.icon} tone="brand" size="lg" />}
            <div>
              <h3 className="mb-1.5 text-xl font-bold text-brand-strong">{block.term}</h3>
              <p className="text-[17px] leading-relaxed text-ink-soft">{block.text}</p>
            </div>
          </div>
        </div>
      );

    case 'points':
      return (
        <div>
          {block.title && (
            <h3 className="mb-4 text-xl font-bold text-ink flex items-center gap-2">
              <span className="h-6 w-1.5 rounded-full bg-brand" />
              {block.title}
            </h3>
          )}
          <div
            className={
              block.variant === 'grid'
                ? 'grid gap-4 sm:grid-cols-2'
                : 'grid gap-3'
            }
          >
            {block.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card"
              >
                {item.emoji ? (
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface-3 text-3xl">
                    {item.emoji}
                  </span>
                ) : (
                  item.icon && <IconBadge icon={item.icon} tone="soft" size="md" />
                )}
                <div>
                  {item.title && <p className="text-base font-bold text-ink leading-tight">{item.title}</p>}
                  {item.text && <p className="text-[15px] leading-relaxed text-ink-soft">{item.text}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'chain':
      return (
        <div className="card p-6 shadow-card">
          {block.title && <h3 className="mb-4 text-lg font-bold text-ink">{block.title}</h3>}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-center gap-2.5">
            {block.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="rounded-2xl border border-line bg-surface px-4 py-3 text-center shadow-card">
                  <span className="block font-bold text-ink text-[15px]">{step.label}</span>
                  <span className="block text-xs text-brand">{step.text}</span>
                </div>
                {i < block.steps.length - 1 && (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-brand/60 shrink-0 hidden sm:block"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'callout': {
      const tones = {
        info: 'bg-brand/8 border-brand/25',
        gold: 'bg-gold-500/10 border-gold-500/30',
        contrast:
          'bg-gradient-to-l from-green-800 to-green-600 text-white border-green-600 dark:from-green-900 dark:to-green-700',
      } as const;
      const isContrast = block.tone === 'contrast';
      return (
        <div className={`rounded-2xl border p-6 shadow-card ${tones[block.tone]}`}>
          <div className="flex items-start gap-3">
            <span className={isContrast ? 'text-gold-400' : 'text-brand'}>
              <Icon name="sparkles" className="w-7 h-7" />
            </span>
            <div>
              {block.title && (
                <p className={`mb-1 text-lg font-bold ${isContrast ? 'text-white' : 'text-ink'}`}>
                  {block.title}
                </p>
              )}
              <p className={`text-[17px] leading-relaxed ${isContrast ? 'text-green-50' : 'text-ink-soft'}`}>
                {block.text}
              </p>
            </div>
          </div>
        </div>
      );
    }

    case 'diagram':
      return (
        <div className="card p-5 sm:p-6">
          <Diagram diagram={block.diagram} />
          {block.caption && (
            <p className="mt-4 text-center text-sm text-ink-muted">{block.caption}</p>
          )}
        </div>
      );

    case 'compare':
      return <CompareBoard block={block} />;

    default:
      return null;
  }
}
