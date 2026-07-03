import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CanvasScaleContext } from '../../lib/canvasScale';

// Fixed PowerPoint-style design surface (16:9). Everything is authored at this
// size and uniformly scaled to fit the viewport, so the course never scrolls.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export function SlideCanvas({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width && height) setScale(Math.min(width / CANVAS_W, height / CANVAS_H));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Recompute on font load (Arabic webfont can shift metrics).
  useEffect(() => {
    (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready?.then(() => {
      const el = wrapRef.current;
      if (el) {
        const { width, height } = el.getBoundingClientRect();
        if (width && height) setScale(Math.min(width / CANVAS_W, height / CANVAS_H));
      }
    });
  }, []);

  return (
    <div ref={wrapRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      <CanvasScaleContext.Provider value={scale}>
        <div
          className="relative shrink-0 overflow-hidden rounded-[22px] border-2 border-green-500/20 shadow-card-lg"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            backgroundColor: 'rgb(var(--surface))',
            backgroundImage:
              'radial-gradient(900px 520px at 100% 0%, rgb(20 160 120 / 0.09), transparent 60%), radial-gradient(820px 480px at 0% 100%, rgb(191 155 74 / 0.08), transparent 60%)',
          }}
        >
          {children}
        </div>
      </CanvasScaleContext.Provider>
    </div>
  );
}
