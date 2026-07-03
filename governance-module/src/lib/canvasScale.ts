import { createContext, useContext } from 'react';

/** Current scale factor applied by SlideCanvas (used to convert pointer deltas
 *  into the canvas's local coordinate space for accurate drag & drop). */
export const CanvasScaleContext = createContext(1);
export const useCanvasScale = () => useContext(CanvasScaleContext);
