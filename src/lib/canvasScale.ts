import { createContext, useContext } from 'react';

/** Current scale factor applied by SlideCanvas (used to convert pointer deltas
 *  into the canvas's local coordinate space for accurate drag & drop). */
export const CanvasScaleContext = createContext(1);
export const useCanvasScale = () => useContext(CanvasScaleContext);

/** DOM node living *inside* SlideCanvas's scaled 1280x720 container. Portal
 *  modals here (instead of document.body) so they scale with everything
 *  else and stay correctly sized on any screen, instead of rendering at
 *  real viewport pixel sizes while the rest of the slide is scaled down. */
export const CanvasPortalContext = createContext<HTMLDivElement | null>(null);
export const useCanvasPortal = () => useContext(CanvasPortalContext);
