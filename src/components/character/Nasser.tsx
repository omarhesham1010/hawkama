import { SpeechBubble } from './SpeechBubble';

export type NasserPose =
  | 'welcome'
  | 'pointLeft'
  | 'pointRight'
  | 'question'
  | 'success'
  | 'tabletLeft'
  | 'tabletRight'
  | 'thinking'
  | 'warning'
  | 'completion';

/** Bag 1's original illustrated Nasser -- lives under Default/ now that bag
 *  2 has its own photographic set at the top level of nasser-assets/. */
export const POSE_SRC: Record<NasserPose, string> = {
  welcome: '/nasser-assets/Default/nasser-welcome.webp',
  pointLeft: '/nasser-assets/Default/nasser-point-right.webp',
  pointRight: '/nasser-assets/Default/nasser-point-left.webp',
  question: '/nasser-assets/Default/nasser-question.webp',
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
export const POSE_SRC_BAG2: Record<NasserPose, string> = {
  welcome: '/nasser-assets/nasser-welcome.webp',
  pointLeft: '/nasser-assets/nasser-point-right.webp',
  pointRight: '/nasser-assets/nasser-point-left.webp',
  question: '/nasser-assets/nasser-question.webp',
  success: '/nasser-assets/nasser-success.webp',
  tabletLeft: '/nasser-assets/nasser-tablet-right.webp',
  tabletRight: '/nasser-assets/nasser-tablet-left.webp',
  thinking: '/nasser-assets/nasser-thinking.webp',
  warning: '/nasser-assets/nasser-warning.webp',
  completion: '/nasser-assets/nasser-completion.webp',
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
