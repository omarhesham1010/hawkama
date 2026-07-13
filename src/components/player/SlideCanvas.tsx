import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CanvasPortalContext, CanvasScaleContext } from '../../lib/canvasScale';
import { SlideTemplateFrame } from './SlideTemplateFrame';

// Fixed PowerPoint-style design surface (16:9). Everything is authored at this
// size and uniformly scaled to fit the viewport, so the course never scrolls.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export function SlideCanvas({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      setScale(Math.min(width / CANVAS_W, height / CANVAS_H) * 0.995);
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
        if (width && height) setScale(Math.min(width / CANVAS_W, height / CANVAS_H) * 0.995);
      }
    });
  }, []);

  return (
    <div ref={wrapRef} className="flex h-full w-full items-center justify-center overflow-hidden p-1">
      <CanvasScaleContext.Provider value={scale}>
        <div
          className="relative shrink-0 overflow-visible rounded-[22px] border border-green-700/15 bg-white shadow-card-lg"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <CanvasPortalContext.Provider value={portalNode}>
            <div className="absolute inset-0 overflow-hidden rounded-[22px]">
              <SlideTemplateFrame />
              {children}
            </div>
            <div ref={setPortalNode} className="absolute inset-0" />
          </CanvasPortalContext.Provider>
        </div>
      </CanvasScaleContext.Provider>
    </div>
  );
}
