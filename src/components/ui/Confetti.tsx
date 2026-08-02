import { useMemo } from 'react';

/** Lightweight CSS confetti burst — celebratory but tasteful (green/gold + accents). */
export function Confetti({ count = 40 }: { count?: number }) {
  // Only the two exact identity colors -- variety comes from opacity, not a
  // different shade.
  const colors = [
    '#008755',
    'rgb(0 135 85 / 0.72)',
    '#9b945f',
    'rgb(155 148 95 / 0.72)',
  ];
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.2 + Math.random() * 1,
        color: colors[i % colors.length],
        rotate: Math.random() * 360,
        scale: 0.7 + Math.random() * 0.7,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-x-0 top-6 z-20 h-32 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  );
}
