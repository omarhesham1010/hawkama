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

export const POSE_SRC: Record<NasserPose, string> = {
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
