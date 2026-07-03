import { useMemo } from 'react';

/** Lightweight CSS confetti burst — celebratory but tasteful (green/gold + accents). */
export function Confetti({ count = 40 }: { count?: number }) {
  const colors = ['#2f8457', '#459c6c', '#bf9b4a', '#d8b866', '#31b8ae', '#74b791'];
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
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-40 overflow-hidden" aria-hidden="true">
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
