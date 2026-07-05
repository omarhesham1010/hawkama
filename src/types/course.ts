// ============================================================
// Type model for the data-driven governance training course.
// Every piece of on-screen educational text lives in
// src/data/courseContent.ts and is typed against this file.
// ============================================================

export type IconKey =
  | 'shield'
  | 'layers'
  | 'building'
  | 'committee'
  | 'matrix'
  | 'flow'
  | 'link'
  | 'scale'
  | 'compass'
  | 'book'
  | 'integrity'
  | 'target'
  | 'clipboard'
  | 'cards'
  | 'gavel'
  | 'quiz'
  | 'flag'
  | 'check'
  | 'alert'
  | 'doc'
  | 'eye'
  | 'sound'
  | 'sparkles';

export type SectionType =
  | 'welcome'
  | 'objectives'
  | 'roadmap'
  | 'lesson'
  | 'activity'
  | 'quiz'
  | 'summary'
  | 'completion';

/** The kind of interactive activity, drives which component renders. */
export type ActivityKind =
  | 'classification'
  | 'threeLines'
  | 'frameworkBuilder'
  | 'scenarioDecision'
  | 'flipCards'
  | 'trueFalse';

/** Named SVG diagrams that lessons can embed. */
export type DiagramKey =
  | 'threeLines'
  | 'frameworkFlow'
  | 'coiFramework'
  | 'govCompliance';

// ---- Lesson content blocks --------------------------------

export interface LeadBlock {
  kind: 'lead';
  text: string;
}

export interface DefinitionBlock {
  kind: 'definition';
  term: string;
  text: string;
  icon?: IconKey;
}

export interface PointItem {
  title?: string;
  text: string;
  icon?: IconKey;
  /** A meaningful emoji rendered instead of the icon tile (varied visuals). */
  emoji?: string;
}

export interface PointsBlock {
  kind: 'points';
  title?: string;
  variant?: 'list' | 'grid';
  items: PointItem[];
}

export interface ChainStep {
  label: string;
  text: string;
}

export interface ChainBlock {
  kind: 'chain';
  title?: string;
  steps: ChainStep[];
}

export interface CalloutBlock {
  kind: 'callout';
  tone: 'info' | 'gold' | 'contrast';
  title?: string;
  text: string;
}

export interface DiagramBlock {
  kind: 'diagram';
  diagram: DiagramKey;
  caption?: string;
}

export interface CompareColumn {
  index: string; // Arabic-Indic numeral shown in the badge
  heading: string;
  tagline: string;
  icon: IconKey;
  points: string[];
}

export interface CompareBlock {
  kind: 'compare';
  subtitle?: string;
  columns: CompareColumn[];
}

export type LessonBlock =
  | LeadBlock
  | DefinitionBlock
  | PointsBlock
  | ChainBlock
  | CalloutBlock
  | DiagramBlock
  | CompareBlock;

// ---- Activities -------------------------------------------

export interface ClassificationItem {
  id: string;
  text: string;
  answer: 'governance' | 'compliance';
  rationale: string;
  needsReview: boolean;
}

export interface ClassificationActivityData {
  kind: 'classification';
  scenario: string;
  categories: { id: 'governance' | 'compliance'; label: string; color: string }[];
  items: ClassificationItem[];
}

export interface OrderingSlot {
  id: string;
  label: string; // e.g. "الخط الأول"
  role: string; // correct role text
  hint: string; // parenthetical
}

export interface ThreeLinesActivityData {
  kind: 'threeLines';
  instruction: string;
  slots: OrderingSlot[]; // in correct order
}

export interface FrameworkPiece {
  id: string;
  title: string;
  role: string;
  icon: IconKey;
}

export interface FrameworkBuilderData {
  kind: 'frameworkBuilder';
  instruction: string;
  pieces: FrameworkPiece[]; // in correct order
}

export interface DecisionStep {
  id: string;
  label: string;
  order: number;
}

export interface ScenarioDecisionData {
  kind: 'scenarioDecision';
  scenario: string;
  identify: {
    question: string;
    options: { id: string; label: string; correct: boolean }[];
    suggestedNote: string; // Educational rationale shown after answering.
    tags: string[];
  };
  correctPath: DecisionStep[]; // ordered correct response
  reflection: string[]; // open, ungraded
}

export interface FlipCard {
  id: string;
  front: string;
  back: string;
  icon: IconKey;
}

export interface FlipCardsData {
  kind: 'flipCards';
  instruction: string;
  cards: FlipCard[];
}

export interface TrueFalseStatement {
  id: string;
  text: string;
  answer: boolean;
  explanation: string;
}

export interface TrueFalseData {
  kind: 'trueFalse';
  statements: TrueFalseStatement[];
}

export type ActivityData =
  | ClassificationActivityData
  | ThreeLinesActivityData
  | FrameworkBuilderData
  | ScenarioDecisionData
  | FlipCardsData
  | TrueFalseData;

// ---- Quiz --------------------------------------------------

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source: string; // provenance in the PPT
}

export interface QuizData {
  passScore: number; // percentage needed to pass
  questions: QuizQuestion[];
}

// ---- Sections (steps in the player) -----------------------

export interface BaseSection {
  id: string;
  type: SectionType;
  navLabel: string;
  title: string;
  icon: IconKey;
  /** Base filename (without extension) for an optional /audio/*.mp3 file. */
  narrationKey: string;
  /** Formal Arabic script used by the Web Speech API fallback. */
  narration: string;
}

export interface WelcomeSection extends BaseSection {
  type: 'welcome';
  eyebrow: string;
  subtitle: string;
  intro: string;
  duration: string;
  highlights: { icon: IconKey; label: string }[];
}

export interface ObjectivesSection extends BaseSection {
  type: 'objectives';
  intro: string;
  objectives: { icon: IconKey; text: string }[];
}

export interface RoadmapSection extends BaseSection {
  type: 'roadmap';
  intro: string;
  stops: { icon: IconKey; label: string; kind: 'درس' | 'نشاط' | 'اختبار' | 'ملخص' }[];
}

export interface LessonSection extends BaseSection {
  type: 'lesson';
  intro: string;
  blocks: LessonBlock[];
}

export interface ActivitySection extends BaseSection {
  type: 'activity';
  activityLabel: string; // "نشاط تدريبي" / "لعبة تدريبية" / "محاكاة قرار"
  intro: string;
  data: ActivityData;
}

export interface QuizSection extends BaseSection {
  type: 'quiz';
  activityLabel: string;
  intro: string;
  quiz: QuizData;
}

export interface SummarySection extends BaseSection {
  type: 'summary';
  intro: string;
  takeaways: { icon: IconKey; title: string; text: string }[];
}

export interface CompletionSection extends BaseSection {
  type: 'completion';
  intro: string;
}

export type Section =
  | WelcomeSection
  | ObjectivesSection
  | RoadmapSection
  | LessonSection
  | ActivitySection
  | QuizSection
  | SummarySection
  | CompletionSection;

export interface Course {
  meta: {
    title: string;
    chapter: string;
    org: string;
    duration: string;
  };
  sections: Section[];
}
