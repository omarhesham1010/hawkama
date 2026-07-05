import { useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { useNarrationContext } from '../audio/NarrationContext';
import { activeStoryCue, storyCues } from '../../lib/storyTiming';

export function CaptionBar({ text, audioKey, spoken }: { text: string; audioKey: string; spoken: number }) {
  const { isPlaying, nowKey } = useNarrationContext();
  const active = isPlaying && nowKey === audioKey;
  const cues = useMemo(() => storyCues(text), [text]);
  const shown = active ? activeStoryCue(text, spoken).cue?.text : cues[0]?.text ?? '';

  return (
    <div className="shrink-0 border-t border-line bg-surface-2/85 backdrop-blur-md">
      <div className="player-caption-inner mx-auto flex max-w-4xl items-center gap-2 px-4 py-1.5">
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${
            active ? 'bg-brand text-white' : 'bg-surface-3 text-ink-muted'
          }`}
        >
          <Icon name="sound" className="h-3.5 w-3.5" />
        </span>
        <p
          className={`line-clamp-1 flex-1 text-center text-[13px] font-semibold leading-snug transition-colors ${
            active ? 'text-ink' : 'text-ink-muted'
          }`}
        >
          {active ? (
            <span className="rounded-md bg-brand/12 px-1.5 py-0.5 text-brand-strong">{shown}</span>
          ) : (
            <span>الشرح الصوتي</span>
          )}
        </p>
      </div>
    </div>
  );
}
