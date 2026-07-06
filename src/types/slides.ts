import type { ActivityData, LessonBlock, QuizData } from './course';

// ============================================================
//  Storyline-style slide model: each slide has a narration,
//  an audio key, a duration, and a timeline that reveals
//  on-stage elements in sync with the voice-over.
// ============================================================

export type AnimType = 'fade-up' | 'fade-in' | 'slide-in' | 'scale-in';

// ---- Beats: each on-screen unit tied to its own narration chunk + animation.
//      Drives reveal + green highlight + progress in sync with the actual voice.
export type BeatAnim =
  | 'fade-up'
  | 'fade-in'
  | 'slide-in'
  | 'scale-in'
  | 'zoom'
  | 'rise'
  | 'flip'
  | 'swing-in';

export type BeatUnit =
  | { t: 'title' }
  | { t: 'lead'; text: string }
  | { t: 'def'; term: string; text: string; emoji: string }
  | { t: 'point'; emoji: string; title?: string; text?: string }
  | { t: 'callout'; tone: 'info' | 'gold' | 'contrast'; title?: string; text: string }
  | { t: 'chain'; steps: { label: string; text: string }[] }
  | { t: 'diagram'; diagram: 'threeLines' | 'frameworkFlow' | 'coiFramework' };

export interface Beat {
  /** narration chunk spoken while this unit is highlighted */
  text: string;
  anim: BeatAnim;
  /** beats sharing a row render side-by-side */
  row?: number;
  /**
   * Flow-node style: 'number' (default) for genuinely sequential steps,
   * 'shape' for parallel/non-ordered items (renders a small diamond marker
   * instead of a numbered circle so not everything looks like a numbered list).
   */
  marker?: 'number' | 'shape';
  unit: BeatUnit;
}

export interface TimelineEvent {
  /** seconds from slide start when the element appears */
  time: number;
  /** element key (matches a key in `content`, or the literal 'title') */
  element: string;
  animation: AnimType;
}

export type SlideKind =
  | 'welcome'
  | 'content'
  | 'activity'
  | 'quiz'
  | 'reflection'
  | 'completion';

export type PptLayout =
  | 'pptIntro'
  | 'pptAgenda'
  | 'pptTitleCards'
  | 'pptTwoPanels'
  | 'pptThreeColumns'
  | 'pptActivitySort'
  | 'pptSixCards'
  | 'pptScenario'
  | 'pptConclusion';

export interface PptCard {
  index?: string;
  title: string;
  text?: string;
  bullets?: string[];
  answer?: string;
  rationale?: string;
  tone?: 'green' | 'gold' | 'blue' | 'gray';
}

export interface PptContent {
  eyebrow?: string;
  courseName?: string;
  unitTitle?: string;
  subtitle?: string;
  intro?: string;
  prompt?: string;
  cards?: PptCard[];
}

export interface Slide {
  id: string; // 'slide-01'
  index: number; // 1-based
  title: string;
  audioKey: string; // 'slide-01' → /audio/slide-01.mp3
  narration: string;
  duration: number; // seconds (drives the simulated timeline)
  kind: SlideKind;
  /** PowerPoint-matched layouts used by the source-deck chapter. */
  layout?: PptLayout;
  ppt?: PptContent;
  /** Large decorative emoji/graphic for the slide (replaces stock imagery). */
  visual?: string;
  /** Which side graphic to render for content slides. */
  visualKind?: 'emoji' | 'target';
  timeline: TimelineEvent[];
  /** On-stage content blocks keyed by element name (content slides). */
  content?: Record<string, LessonBlock>;
  /** Beat-driven content (voice-synced reveal + highlight). */
  beats?: Beat[];
  /** Embedded training activity (activity slides). */
  activity?: ActivityData;
  /** For a split decision simulation: which stage this slide shows. */
  activityMode?: 'both' | 'identify' | 'path';
  /** Knowledge-check questions (quiz slide). */
  quiz?: QuizData;
  /** Reflection prompts (reflection slide) — never graded. */
  reflection?: string[];
  /** Optional label shown as the activity/quiz chip. */
  activityLabel?: string;
}
