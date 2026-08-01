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
  | 'pptConclusion'
  | 'pptTimeline'
  | 'pptMatrix'
  | 'pptSpotlight';

export interface PptCard {
  index?: string;
  title: string;
  text?: string;
  /** Short one-line explainer shown under the title on the hero card when
   *  the card renders as bullets-with-subcards (bullets suppress `text`,
   *  which otherwise fills this role for plain cards) -- ignored outside
   *  that mode. */
  subtitle?: string;
  bullets?: string[];
  syncText?: string;
  answer?: string;
  rationale?: string;
  tone?: 'green' | 'gold' | 'blue' | 'gray';
  /** course/1's cardNarration() auto-prepends a bridge phrase (drawn from a
   *  shuffled pool) before the card title/text when speaking it -- a small
   *  number of cards read awkwardly with whichever bridge lands on them
   *  (e.g. "وببساطة، فإن الأثر العملي هو أن الانتقال من..."). Setting these
   *  replaces just that one bridge+title or bridge+text line with fixed,
   *  hand-written phrasing, leaving the rest of the card's narration
   *  (bullets, takeaway) generated as normal. */
  spokenIntro?: string;
  spokenDetail?: string;
}

export interface PptContent {
  eyebrow?: string;
  courseName?: string;
  unitTitle?: string;
  subtitle?: string;
  intro?: string;
  prompt?: string;
  cards?: PptCard[];
  /** Additional acts that take over the same scene, one after another, as
   *  narration moves past `cards` and starts naming each one -- for slides
   *  whose narration covers several genuinely distinct enumerated lists or
   *  named concepts (e.g. "the all-hazards approach", then "three
   *  non-negotiables", then "three leadership questions"). Each act gets
   *  the exact same per-card visual/timing treatment as `cards`, staged as
   *  its own shot instead of crowding one grid or leaning on a generic
   *  bridging image. */
  laterActs?: PptCard[][];
  /** Per-act layout override, same order as `[cards, ...laterActs]`. A
   *  slide's acts don't have to share one visual shape -- naming a
   *  different layout per index (e.g. spotlight for the framing card,
   *  matrix for a 2x2 breakdown, titleCards for a flat list) keeps
   *  consecutive shots from feeling like the same grid restyled. Any index
   *  left unset (including when this whole field is omitted) falls back
   *  to the slide's own top-level `layout`. */
  actLayouts?: PptLayout[];
  /** Turns specific acts into interactive checkpoints instead of pure
   *  narrated shots: once that act's own narration finishes, playback
   *  pauses, the act's cards are replaced by the interactive activity, and
   *  narration only resumes into the next act once the learner completes
   *  it. Indexed the same as `actLayouts` -- most slides leave most
   *  indexes undefined. Lets one activity slide interleave several small
   *  "narrate a bit, then do a bit" interactions instead of one long
   *  narrated setup followed by a single interactive shot at the end. */
  actActivities?: (ActivityCheckpoint | undefined)[];
  checks?: PptCard[];
}

export interface ActivityCheckpoint {
  activity: ActivityData;
  /** For a split decision simulation checkpoint: which stage this one shows. */
  mode?: 'both' | 'identify' | 'path';
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
