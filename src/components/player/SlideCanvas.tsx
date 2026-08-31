import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CanvasPortalContext, CanvasScaleContext } from '../../lib/canvasScale';
import { SlideTemplateFrame } from './SlideTemplateFrame';

// Fixed PowerPoint-style design surface (16:9). Everything is authored at this
// size and uniformly scaled to fit the viewport, so the course never scrolls.
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export function SlideCanvas({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'intro';
}) {
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

  // The stage is authored at a fixed 1280x720 and only ever shrunk visually
  // via `transform: scale()` -- its real (pre-scale) layout box is far wider
  // than this wrapper, which relies on flex centering + overflow-hidden to
  // show only the scaled-down middle slice. `overflow: hidden` blocks
  // user-driven scrolling (wheel/scrollbar) but NOT a browser's automatic
  // scrollIntoView when an inner button receives focus after a click --
  // clicking any activity/quiz button near the stage's real (unscaled) edge
  // (e.g. the bottom-left "next question" control) makes the browser think
  // it needs to scroll this wrapper to bring the button into view, which
  // permanently knocks the whole slide off-center for the rest of the
  // session (confirmed live: clicking through course/11's pre-course
  // activity left scrollLeft stuck at -141, shifting the entire slide card
  // ~140px off-screen to the right). This wrapper must never actually
  // scroll, so immediately undo any scroll offset the browser applies.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const resetScroll = () => {
      if (el.scrollLeft !== 0) el.scrollLeft = 0;
      if (el.scrollTop !== 0) el.scrollTop = 0;
    };
    el.addEventListener('scroll', resetScroll, { passive: true });
    return () => el.removeEventListener('scroll', resetScroll);
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
    <div ref={wrapRef} className="slide-canvas-wrap flex h-full w-full items-center justify-center overflow-hidden p-1">
      <CanvasScaleContext.Provider value={scale}>
        <div
          className="slide-canvas-stage relative shrink-0 overflow-visible rounded-[22px] border border-green-700/15 bg-white shadow-card-lg"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <CanvasPortalContext.Provider value={portalNode}>
            <div className="absolute inset-0 overflow-hidden rounded-[22px]">
              <SlideTemplateFrame variant={variant} />
              {children}
            </div>
            <div ref={setPortalNode} className="pointer-events-none absolute inset-0" />
          </CanvasPortalContext.Provider>
        </div>
      </CanvasScaleContext.Provider>
    </div>
  );
}
