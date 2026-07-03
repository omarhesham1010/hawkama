import { Icon } from '../ui/Icon';
import { useNarrationContext } from './NarrationContext';

/** Floating audio control that appears whenever narration is active. */
export function StickyNarrationBar() {
  const { isPlaying, isLoading, nowLabel, source, stop, replay } = useNarrationContext();
  if (!isPlaying && !isLoading) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 animate-fade-up">
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface/95 backdrop-blur px-4 py-2.5 shadow-card-lg">
        <span className="flex items-end gap-[3px] h-4 text-brand" aria-hidden="true">
          {isLoading ? (
            <span className="inline-block w-4 h-4 rounded-full border-2 border-brand/30 border-t-brand animate-spin" />
          ) : (
            [0, 1, 2, 3].map((i) => (
              <span key={i} className="sound-bar w-[3px] h-full rounded-full bg-current" />
            ))
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {nowLabel ?? 'الشرح الصوتي'}
          </p>
          <p className="text-[11px] text-ink-muted">
            {source === 'audio' ? 'ملف صوتي' : 'قراءة صوتية آلية'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={replay}
            title="إعادة"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-ink-soft hover:text-brand"
          >
            <Icon name="flow" className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={stop}
            title="إيقاف"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-white"
          >
            <span className="block h-3 w-3 rounded-[2px] bg-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
