import type { PptCard } from '../types/slides';
import { storyCues } from './storyTiming';

function cleanText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim();
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

export function activePptCardForCue(revealCueIndexes: number[], cueIndex: number) {
  let active = -1;
  for (let index = 0; index < revealCueIndexes.length; index += 1) {
    if (cueIndex < revealCueIndexes[index]) break;
    active = index;
  }
  return active;
}
