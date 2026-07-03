import { useMemo } from 'react';
import { Icon } from '../ui/Icon';
import { useNarrationContext } from '../audio/NarrationContext';

interface Sentence {
  start: number;
  end: number;
  text: string;
}

function splitSentences(text: string): Sentence[] {
  const out: Sentence[] = [];
  const re = /[.؟!\n]/g;
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const end = m.index + 1;
    const t = text.slice(start, end).trim();
    if (t) out.push({ start, end, text: t });
    start = end;
  }
  if (start < text.length) {
    const t = text.slice(start).trim();
    if (t) out.push({ start, end: text.length, text: t });
  }
  return out;
}

/**
 * Live caption strip: shows the narration text and highlights the sentence
 * currently being spoken (karaoke-style, driven by TTS boundary events).
 * Lives in the player chrome so it never affects the fixed 16:9 canvas.
 */
export function CaptionBar({ text, audioKey }: { text: string; audioKey: string }) {
  const { charIndex, isPlaying, nowKey } = useNarrationContext();
  const active = isPlaying && nowKey === audioKey;
  const sentences = useMemo(() => splitSentences(text), [text]);

  const activeIdx = useMemo(() => {
    if (!active) return -1;
    for (let i = 0; i < sentences.length; i++) {
      if (charIndex >= sentences[i].start && charIndex < sentences[i].end) return i;
    }
    return -1;
  }, [active, charIndex, sentences]);

  const shown = active && activeIdx >= 0 ? sentences[activeIdx].text : sentences[0]?.text ?? '';

  return (
    <div className="border-t border-line bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2.5">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
            active ? 'bg-brand text-white' : 'bg-surface-3 text-ink-muted'
          }`}
        >
          <Icon name="sound" className="w-4 h-4" />
        </span>
        <p
          className={`line-clamp-2 text-center text-[15px] font-semibold leading-snug transition-colors ${
            active ? 'text-ink' : 'text-ink-muted'
          }`}
        >
          {active ? (
            <span className="rounded-md bg-brand/12 px-1.5 py-0.5 text-brand-strong">{shown}</span>
          ) : (
            <span>الشرح الصوتي — اضغط زر التشغيل للاستماع والمتابعة النصية</span>
          )}
        </p>
      </div>
    </div>
  );
}
