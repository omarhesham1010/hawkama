import { SpeechBubble } from './SpeechBubble';

export type NasserPose =
  | 'welcome'
  | 'pointLeft'
  | 'pointRight'
  | 'question'
  | 'questionLeft'
  | 'questionRight'
  | 'success'
  | 'tabletLeft'
  | 'tabletRight'
  | 'thinking'
  | 'warning'
  | 'completion';

/** Bag 1's original illustrated Nasser -- lives under Default/ now that bag
 *  2 has its own photographic set at the top level of nasser-assets/. Bag 1
 *  never got a left/right question pair, so questionLeft/questionRight both
 *  fall back to the single question.webp it already has. */
export const POSE_SRC: Record<NasserPose, string> = {
  welcome: '/nasser-assets/Default/nasser-welcome.webp',
  pointLeft: '/nasser-assets/Default/nasser-point-right.webp',
  pointRight: '/nasser-assets/Default/nasser-point-left.webp',
  question: '/nasser-assets/Default/nasser-question.webp',
  questionLeft: '/nasser-assets/Default/nasser-question.webp',
  questionRight: '/nasser-assets/Default/nasser-question.webp',
  success: '/nasser-assets/Default/nasser-success.webp',
  tabletLeft: '/nasser-assets/Default/nasser-tablet-right.webp',
  tabletRight: '/nasser-assets/Default/nasser-tablet-left.webp',
  thinking: '/nasser-assets/Default/nasser-thinking.webp',
  warning: '/nasser-assets/Default/nasser-warning.webp',
  completion: '/nasser-assets/Default/nasser-completion.webp',
};

/** Bag 2's photographic Nasser (Ministry of Health emergency uniform).
 *  Same pointLeft/pointRight and tabletLeft/tabletRight file swap as the
 *  bag-1 set above: the "Left"/"Right" pose name is which side of the
 *  screen Nasser is standing on, not which hand he gestures with, so the
 *  file that visually points/holds toward a given side is assigned to the
 *  *opposite* pose key. */
const BAG2_DIR = '/nasser-assets/Ministry%20of%20Health';

export const POSE_SRC_BAG2: Record<NasserPose, string> = {
  welcome: `${BAG2_DIR}/nasser-welcome.webp`,
  pointLeft: `${BAG2_DIR}/nasser-point-right.webp`,
  pointRight: `${BAG2_DIR}/nasser-point-left.webp`,
  question: `${BAG2_DIR}/nasser-question-left.webp`,
  questionLeft: `${BAG2_DIR}/nasser-question-right.webp`,
  questionRight: `${BAG2_DIR}/nasser-question-left.webp`,
  success: `${BAG2_DIR}/nasser-success.webp`,
  tabletLeft: `${BAG2_DIR}/nasser-tablet-right.webp`,
  tabletRight: `${BAG2_DIR}/nasser-tablet-left.webp`,
  thinking: `${BAG2_DIR}/nasser-thinking.webp`,
  warning: `${BAG2_DIR}/nasser-warning.webp`,
  completion: `${BAG2_DIR}/nasser-completion.webp`,
};

/** Course/11's own uniformed "compliance officer" Nasser (وزارة الصحة cap +
 *  tan field vest + "فريق الالتزام" badge), built from renders the client
 *  sent Aug 31 -- background-removed, cropped to a consistent waist-up
 *  frame (same treatment as the bag-2 photographic set above), and paired
 *  left/right for every gesture that holds or points at something so he can
 *  stand on either side of the slide. The magnifying glass fills in for
 *  "question" (investigating a case) and the vital-signs scanner fills in
 *  for "point" (presenting something to the learner) since this persona
 *  has no literal index-finger point pose. Same file-swap rule as above:
 *  the render whose prop reaches toward a given side is assigned to the
 *  *opposite* pose key. */
const CE11_DIR = '/nasser-assets/Compliance%20Team';

export const POSE_SRC_CE11: Record<NasserPose, string> = {
  welcome: `${CE11_DIR}/nasser-welcome.webp`,
  pointLeft: `${CE11_DIR}/nasser-point-left.webp`,
  pointRight: `${CE11_DIR}/nasser-point-right.webp`,
  question: `${CE11_DIR}/nasser-question-left.webp`,
  questionLeft: `${CE11_DIR}/nasser-question-left.webp`,
  questionRight: `${CE11_DIR}/nasser-question-right.webp`,
  success: `${CE11_DIR}/nasser-success.webp`,
  tabletLeft: `${CE11_DIR}/nasser-tablet-left.webp`,
  tabletRight: `${CE11_DIR}/nasser-tablet-right.webp`,
  thinking: `${CE11_DIR}/nasser-thinking.webp`,
  warning: `${CE11_DIR}/nasser-warning.webp`,
  completion: `${CE11_DIR}/nasser-completion.webp`,
};

export function Nasser({
  pose,
  line,
  side = 'left',
  size = 'md',
  className = '',
}: {
  pose: NasserPose;
  line?: string;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const imgSize = size === 'lg' ? 'h-[470px]' : size === 'sm' ? 'h-[270px]' : 'h-[380px]';
  const bubbleTail = side === 'right' ? 'left' : 'right';
  return (
    <div
      className={`pointer-events-none relative flex shrink-0 flex-col items-center justify-end ${
        side === 'right' ? 'items-end' : 'items-start'
      } ${className}`}
    >
      {line && (
        <div className={`mb-2 ${side === 'right' ? 'ml-4' : 'mr-4'} animate-fade-up`}>
          <SpeechBubble text={line} tailTo={bubbleTail} compact={size === 'sm'} />
        </div>
      )}
      <img
        src={POSE_SRC[pose]}
        alt="ناصر المدرب"
        className={`${imgSize} max-w-full object-contain object-bottom drop-shadow-2xl`}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
    </div>
  );
}
