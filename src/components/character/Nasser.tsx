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
  welcome: '/nasser-assets/nasser-welcome.png',
  pointLeft: '/nasser-assets/nasser-point-left.png',
  pointRight: '/nasser-assets/nasser-point-right.png',
  question: '/nasser-assets/nasser-question.png',
  success: '/nasser-assets/nasser-success.png',
  tabletLeft: '/nasser-assets/nasser-tablet-left.png',
  tabletRight: '/nasser-assets/nasser-tablet-right.png',
  thinking: '/nasser-assets/nasser-thinking.png',
  warning: '/nasser-assets/nasser-warning.png',
  completion: '/nasser-assets/nasser-completion.png',
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
  const imgSize = size === 'lg' ? 'h-[390px]' : size === 'sm' ? 'h-[210px]' : 'h-[300px]';
  return (
    <div
      className={`pointer-events-none relative flex shrink-0 flex-col items-center justify-end ${
        side === 'right' ? 'items-end' : 'items-start'
      } ${className}`}
    >
      {line && (
        <div className={`mb-2 ${side === 'right' ? 'ml-4' : 'mr-4'} animate-fade-up`}>
          <SpeechBubble text={line} tailTo={side} compact={size === 'sm'} />
        </div>
      )}
      <img
        src={POSE_SRC[pose]}
        alt="ناصر المدرب"
        className={`${imgSize} max-w-full object-contain object-bottom drop-shadow-2xl`}
        draggable={false}
      />
    </div>
  );
}
