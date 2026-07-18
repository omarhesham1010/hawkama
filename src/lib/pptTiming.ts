import type { PptCard } from '../types/slides';
import { storyCues } from './storyTiming';

function cleanText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

// Strips a leading Arabic definite article from each word ("العمليات" ->
// "عمليات"). Used only as a *fallback* when the plain exact-title search
// below finds nothing -- applying it unconditionally would make a short
// title match its own word's very first (often generic/unrelated) mention
// anywhere earlier in the narration instead of the specific enumerated
// mention it's actually meant to sync to.
function stripDefiniteArticles(value: string) {
  return value.replace(/(^|\s)ال(?=\S)/gu, '$1');
}

function wordsOf(value: string) {
  return cleanText(value).split(' ').filter((word) => word.length > 2);
}

function cardText(card: PptCard) {
  return [card.title, card.text, ...(card.bullets ?? [])].filter(Boolean).join(' ');
}

export function scorePptCardCue(card: PptCard, cueText: string) {
  const cueWords = wordsOf(cueText);
  if (!cueWords.length) return 0;
  const cleanCue = cleanText(cueText);
  const title = cleanText(card.title);
  const body = cleanText(cardText(card));
  let score = 0;
  if (title && cleanCue.includes(title)) score += 14;
  if (body && cleanCue.includes(body.slice(0, 42))) score += 6;
  for (const word of cueWords) {
    if (title.includes(word)) score += 2.2;
    if (body.includes(word)) score += 1;
  }
  return score;
}

export function pptCardCueIndexes(cards: PptCard[], narration: string) {
  const cues = storyCues(narration);
  if (!cues.length) return cards.map(() => 0);

  // Some slides introduce their cards with a generic "shown in front of
  // you" gesture ("أربع أشياء موضحة أمامك") instead of naming each item in
  // speech -- reading every card title aloud back to back would sound
  // robotic, so the script just points at the screen. When a card can't
  // find its own mention anywhere, this is where it actually belongs: the
  // moment Nasser gestures at the cards, not some unrelated later sentence
  // the word-overlap fallback happens to score highest.
  const shownHereCueIndex = cues.findIndex((cue) => /موضح\S*\s+أمامك/.test(cue.text));

  let previous = -1;
  return cards.map((card, cardIndex) => {
    const title = cleanText(card.title);
    // >= previous, not > previous: several cards are often named together in
    // the very same sentence ("X، Y، Z، وW"). The old strict ">" forced every
    // card after the first to search only from the NEXT cue onward, so it
    // could never match the cue it was actually named in and instead landed
    // on some unrelated later sentence. Allowing the same cue to be reused
    // lets a whole enumerated list reveal together, which is both correct
    // and how a listener would expect it to read.
    const exactTitleCue = cues.findIndex(
      (cue, cueIndex) => cueIndex >= previous && title && cleanText(cue.text).includes(title),
    );
    if (exactTitleCue >= 0) {
      previous = exactTitleCue;
      return previous;
    }
    // Fallback pass, article-insensitive: a title like "العمليات" should
    // still match narration that says the bare word "عمليات" (or the
    // reverse). Only tried after the plain search above finds nothing, so
    // a title that already matches exactly never gets re-pointed at some
    // earlier, unrelated mention of the same bare word.
    const strippedTitle = stripDefiniteArticles(title);
    if (strippedTitle && strippedTitle !== title) {
      const articleInsensitiveCue = cues.findIndex(
        (cue, cueIndex) => cueIndex >= previous && cleanText(stripDefiniteArticles(cue.text)).includes(strippedTitle),
      );
      if (articleInsensitiveCue >= 0) {
        previous = articleInsensitiveCue;
        return previous;
      }
    }

    // No exact mention anywhere -- if the narration ever gestures at the
    // screen instead of naming items, that gesture IS this card's real
    // moment. A word-overlap score here is usually a coincidental match
    // against an unrelated sentence (e.g. a station card whose title
    // happens to share one word with the activity's stated objective), not
    // a genuine second mention, so it shouldn't outrank the explicit cue.
    if (shownHereCueIndex >= 0 && shownHereCueIndex >= previous) {
      previous = shownHereCueIndex;
      return previous;
    }

    let best = { cueIndex: -1, score: 0 };
    for (let cueIndex = Math.max(previous, 0); cueIndex < cues.length; cueIndex += 1) {
      const score = scorePptCardCue(card, cues[cueIndex].text);
      if (score > best.score) best = { cueIndex, score };
    }
    const proportional = Math.floor(((cardIndex + 1) * cues.length) / (cards.length + 1));
    const selected = best.score >= 5 ? best.cueIndex : proportional;
    previous = Math.min(cues.length - 1, Math.max(previous, selected));
    return previous;
  });
}

// Maps a cleaned (lowercased, punctuation-stripped, whitespace-collapsed)
// copy of `text` back to the original character index each cleaned
// character came from, so a match found in the cleaned copy can be
// translated back into a real position in the source text.
function cleanedPositionMap(text: string) {
  let cleaned = '';
  const positions: number[] = [];
  let pendingSpace = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (/[\p{L}\p{N}]/u.test(ch)) {
      if (pendingSpace && cleaned.length) {
        cleaned += ' ';
        positions.push(i);
      }
      cleaned += ch.toLowerCase();
      positions.push(i);
      pendingSpace = false;
    } else {
      pendingSpace = true;
    }
  }
  return { cleaned, positions };
}

function findTitleOffset(cueText: string, cueStart: number, card: PptCard): number | null {
  const title = cleanText(card.title);
  if (!title) return null;
  const { cleaned, positions } = cleanedPositionMap(cueText);
  const idx = cleaned.indexOf(title) >= 0 ? cleaned.indexOf(title) : cleaned.indexOf(title.split(' ')[0]);
  if (idx < 0) return null;
  return cueStart + (positions[idx] ?? 0);
}

/** Character position (within `narration`) where each card should reveal --
 *  finer-grained than pptCardCueIndexes' whole-sentence cue. Several cards
 *  are routinely named in the very same sentence ("آلية التفعيل، توزيع
 *  الأدوار، إدارة الموارد..."); snapping all of them to that sentence's
 *  start would pop them in together the instant it begins, instead of one
 *  by one as Nasser actually says each one. This locates each card's own
 *  title text inside its assigned cue and orders/staggers cards that share
 *  a cue accordingly, falling back to an even split across the cue when a
 *  card has no individual mention (e.g. a "shown in front of you" list). */
export function pptCardRevealOffsets(cards: PptCard[], narration: string): number[] {
  const cues = storyCues(narration);
  if (!cues.length) return cards.map(() => 0);

  const cueIndexes = pptCardCueIndexes(cards, narration);
  const offsets = new Array(cards.length).fill(0);
  const cardIndexesByCue = new Map<number, number[]>();
  cueIndexes.forEach((cueIndex, cardIndex) => {
    if (!cardIndexesByCue.has(cueIndex)) cardIndexesByCue.set(cueIndex, []);
    cardIndexesByCue.get(cueIndex)!.push(cardIndex);
  });

  for (const [cueIndex, cardIndexes] of cardIndexesByCue) {
    const cue = cues[cueIndex];
    if (!cue) continue;
    if (cardIndexes.length === 1) {
      const cardIndex = cardIndexes[0];
      offsets[cardIndex] = findTitleOffset(cue.text, cue.start, cards[cardIndex]) ?? cue.start;
      continue;
    }
    const found = cardIndexes.map((cardIndex) => ({
      cardIndex,
      pos: findTitleOffset(cue.text, cue.start, cards[cardIndex]),
    }));
    found.sort((a, b) => (a.pos ?? Infinity) - (b.pos ?? Infinity));
    const span = Math.max(found.length, cue.end - cue.start);
    let cursor = cue.start;
    found.forEach((entry, order) => {
      const fallback = cue.start + Math.floor((span * order) / found.length);
      const pos = Math.max(cursor, entry.pos ?? fallback);
      offsets[entry.cardIndex] = pos;
      cursor = pos + 1; // strictly increasing, so ties still separate in order
    });
  }

  return offsets;
}

export function activePptCardForCue(revealCueIndexes: number[], cueIndex: number) {
  let active = -1;
  for (let index = 0; index < revealCueIndexes.length; index += 1) {
    if (cueIndex < revealCueIndexes[index]) break;
    active = index;
  }
  return active;
}
