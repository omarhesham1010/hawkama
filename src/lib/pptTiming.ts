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

  let previous = -1;
  return cards.map((card, cardIndex) => {
    let best = { cueIndex: -1, score: 0 };
    for (let cueIndex = previous + 1; cueIndex < cues.length; cueIndex += 1) {
      const score = scorePptCardCue(card, cues[cueIndex].text);
      if (score > best.score) best = { cueIndex, score };
    }
    const proportional = Math.floor(((cardIndex + 1) * cues.length) / (cards.length + 1));
    const selected = best.score >= 5 ? best.cueIndex : proportional;
    previous = Math.min(cues.length - 1, Math.max(previous + 1, selected));
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
