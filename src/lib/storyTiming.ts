export interface StoryCue {
  start: number;
  end: number;
  text: string;
  speechWeight: number;
  pauseWeight: number;
  weight: number;
}

const BREAKS = new Set(['،', '؛', '.', '؟', '!', '\n']);
const HARD_BREAKS = new Set(['.', '؟', '!', '\n']);
const MIN_CUE_CHARS = 34;
const MAX_CUE_CHARS = 118;

function normalizeSpaces(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function pauseWeight(mark: string) {
  if (HARD_BREAKS.has(mark)) return 9;
  if (mark === '؛') return 6;
  if (mark === '،') return 4;
  return 3;
}

function cueWeights(text: string, mark: string) {
  const spokenChars = normalizeSpaces(text).replace(/\s/g, '').length;
  const speechWeight = Math.max(18, spokenChars);
  const pause = pauseWeight(mark);
  return { speechWeight, pauseWeight: pause, weight: speechWeight + pause };
}

function pushCue(out: StoryCue[], source: string, start: number, end: number, mark: string) {
  const text = source.slice(start, end).trim();
  if (!text) return;
  const weights = cueWeights(text, mark);
  out.push({ start, end, text, ...weights });
}

export function storyCues(text: string): StoryCue[] {
  const raw: StoryCue[] = [];
  let start = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (!BREAKS.has(ch)) continue;

    const candidate = text.slice(start, i + 1).trim();
    const shouldBreak = HARD_BREAKS.has(ch) || candidate.length >= MIN_CUE_CHARS;
    if (shouldBreak) {
      pushCue(raw, text, start, i + 1, ch);
      start = i + 1;
    }
  }

  pushCue(raw, text, start, text.length, '.');
  if (!raw.length) pushCue(raw, text, 0, text.length, '.');

  const cues: StoryCue[] = [];
  for (const cue of raw) {
    const prev = cues[cues.length - 1];
    if (prev && prev.text.length + cue.text.length < MIN_CUE_CHARS) {
      const mergedText = normalizeSpaces(`${prev.text} ${cue.text}`);
      const weights = cueWeights(mergedText, '.');
      cues[cues.length - 1] = {
        start: prev.start,
        end: cue.end,
        text: mergedText,
        ...weights,
      };
    } else if (cue.text.length > MAX_CUE_CHARS) {
      const words = cue.text.split(/\s+/);
      let part = '';
      let partStart = cue.start;
      for (const word of words) {
        const next = part ? `${part} ${word}` : word;
        if (next.length > MAX_CUE_CHARS && part) {
          const partEnd = partStart + part.length;
          pushCue(cues, text, partStart, partEnd, '،');
          partStart = partEnd + 1;
          part = word;
        } else {
          part = next;
        }
      }
      if (part) {
        const weights = cueWeights(part, '.');
        cues.push({ start: partStart, end: cue.end, text: part, ...weights });
      }
    } else {
      cues.push(cue);
    }
  }

  return cues;
}

export function activeStoryCue(text: string, spoken: number) {
  const cues = storyCues(text);
  const pos = Math.max(0, Math.min(text.length, spoken));
  const found = cues.findIndex((cue) => pos >= cue.start && pos <= cue.end);
  const index = found >= 0 ? found : cues.length - 1;
  return { cue: cues[index] ?? cues[cues.length - 1], index };
}

export function spokenFromAudioProgress(text: string, progress: number) {
  const cues = storyCues(text);
  if (!cues.length) return 0;

  const clamped = Math.max(0, Math.min(1, progress));
  const totalWeight = cues.reduce((sum, cue) => sum + cue.weight, 0);
  const target = clamped * totalWeight;

  let acc = 0;
  for (const cue of cues) {
    const cueEnd = acc + cue.weight;
    if (target <= cueEnd) {
      const inside = Math.max(0, target - acc);
      const speechProgress = Math.min(1, inside / cue.speechWeight);
      return cue.start + (cue.end - cue.start) * speechProgress;
    }
    acc = cueEnd;
  }

  return text.length;
}
