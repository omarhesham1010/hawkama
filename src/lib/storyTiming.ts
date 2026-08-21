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
      // `cue.text` is `text.slice(cue.start, cue.end).trim()` -- if that raw
      // slice had leading whitespace (e.g. right after a comma-joined
      // previous cue), trim() strips it from `cue.text` but `cue.start`
      // still points at the UNTRIMMED position. Reconstructing `part` by
      // joining `words` with single spaces (below) measures lengths against
      // the TRIMMED text, so seeding `partStart` from the untrimmed
      // `cue.start` put every computed `partEnd` that many characters short
      // of its real position -- silently dropping that many trailing
      // characters (typically the last letter of the last word before the
      // split) at every long-cue split point. This was the deterministic
      // "last letter of a word missing in Nasser's box" defect: e.g.
      // "الصناعات" rendering as "الصناعا" (dropping its final ت) whenever a
      // >MAX_CUE_CHARS cue happened to split right after it, independent of
      // any reveal-clock timing.
      let partStart = cue.start + (text.slice(cue.start, cue.end).length - text.slice(cue.start, cue.end).trimStart().length);
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

export function spokenFromAudioAlignment(
  textLength: number,
  elapsedSeconds: number,
  anchors: readonly (readonly [number, number, number])[],
) {
  if (!anchors.length || elapsedSeconds < anchors[0][1]) return 0;

  let low = 0;
  let high = anchors.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (anchors[middle][1] <= elapsedSeconds) low = middle + 1;
    else high = middle - 1;
  }

  const anchor = anchors[Math.max(0, high)];
  const next = anchors[Math.min(anchors.length - 1, high + 1)];
  const span = Math.max(0.001, next[1] - anchor[1]);
  const fraction = Math.max(0, Math.min(1, (elapsedSeconds - anchor[1]) / span));
  return Math.min(textLength, anchor[0] + (next[0] - anchor[0]) * fraction + 1);
}

/** Inverse of spokenFromAudioAlignment: given a character position in the
 *  narration, find the matching time (seconds) in its recorded audio — lets
 *  us seek an already-recorded slide narration to the exact moment Nasser
 *  started talking about one particular card, instead of recording new
 *  audio for a replay. */
export function timeFromAudioAlignment(
  charIndex: number,
  anchors: readonly (readonly [number, number, number])[],
) {
  if (!anchors.length) return 0;
  if (charIndex <= anchors[0][0]) return anchors[0][1];
  if (charIndex >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];

  let low = 0;
  let high = anchors.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (anchors[middle][0] <= charIndex) low = middle + 1;
    else high = middle - 1;
  }

  const anchor = anchors[Math.max(0, high)];
  const next = anchors[Math.min(anchors.length - 1, high + 1)];
  const span = Math.max(1, next[0] - anchor[0]);
  const fraction = Math.max(0, Math.min(1, (charIndex - anchor[0]) / span));
  return anchor[1] + (next[1] - anchor[1]) * fraction;
}

export function spokenFromTtsCue(
  cueStart: number,
  cueEnd: number,
  elapsedSeconds: number,
  rate: number,
  charsPerSecond = 10.8,
) {
  const start = Math.max(0, cueStart);
  const end = Math.max(start, cueEnd);
  const elapsed = Math.max(0, elapsedSeconds);
  return Math.min(end, start + elapsed * charsPerSecond * Math.max(0.1, rate));
}

export interface TtsChunk {
  start: number;
  end: number;
  text: string;
}

function chunkEndNearBoundary(text: string, start: number, limit: number) {
  const hardEnd = Math.min(text.length, start + limit);
  if (hardEnd >= text.length) return text.length;
  const minimum = start + Math.floor(limit * 0.55);
  for (let index = hardEnd; index >= minimum; index -= 1) {
    if (/[.؟!؛،\n]/.test(text[index - 1] ?? '')) return index;
  }
  const space = text.lastIndexOf(' ', hardEnd - 1);
  return space >= minimum ? Math.min(hardEnd, space + 1) : hardEnd;
}

export function ttsChunks(text: string, firstLimit = 96, followingLimit = 220): TtsChunk[] {
  if (!text) return [];
  const chunks: TtsChunk[] = [];
  let start = 0;
  while (start < text.length) {
    const limit = chunks.length === 0 ? firstLimit : followingLimit;
    const end = chunkEndNearBoundary(text, start, limit);
    chunks.push({ start, end, text: text.slice(start, end) });
    start = end;
  }
  return chunks;
}
