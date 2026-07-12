import { useCallback, useEffect, useState } from 'react';
import { useNarrationContext } from './components/audio/NarrationContext';
import { PlatformHome } from './components/platform/PlatformHome';
import { warmVisualAssets } from './lib/assetPreload';
import { courseHash, courseIdFromLocation } from './lib/courseRoutes';
import SlidePlayer from './SlidePlayer';

interface Route {
  view: 'home' | 'course';
  courseId: string;
  slide: number; // 1-based
}

function parseHash(): Route {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'bag' && parts[2] === 'chapter') {
    const bag = Number.parseInt(parts[1] || '', 10);
    const chapter = Number.parseInt(parts[3] || '', 10);
    const slidePart = parts[4] === 'slide' ? parts[5] : '1';
    const slide = Number.parseInt(slidePart || '1', 10);
    const courseId = courseIdFromLocation(bag, chapter);
    if (courseId) {
      return { view: 'course', courseId, slide: Number.isNaN(slide) ? 1 : Math.max(1, slide) };
    }
  }
  if (parts[0] === 'course') {
    const legacySlide = parseInt(parts[1] || '1', 10);
    if (!Number.isNaN(legacySlide)) {
      return { view: 'course', courseId: 'governance-intro', slide: legacySlide };
    }
    const courseId = parts[1] || 'governance-intro';
    const n = parseInt(parts[2] || '1', 10);
    return { view: 'course', courseId, slide: Number.isNaN(n) ? 1 : n };
  }
  return { view: 'home', courseId: 'governance-intro', slide: 1 };
}

export default function App() {
  const narration = useNarrationContext();
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    warmVisualAssets();
  }, []);

  useEffect(() => {
    if (route.view !== 'course') return;
    const canonical = courseHash(route.courseId, route.slide);
    if (window.location.hash !== canonical) window.history.replaceState(null, '', canonical);
  }, [route]);

  // Keep the view in sync with the URL so links are shareable / deep-linkable.
  useEffect(() => {
    const onHash = () => {
      narration.stop();
      setRoute(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [narration]);

  const enterChapter = useCallback((courseId: string) => {
    window.location.hash = courseHash(courseId);
  }, []);

  const exitToHome = useCallback(() => {
    window.location.hash = '#/';
  }, []);

  if (route.view === 'course') {
    return <SlidePlayer key={route.courseId} courseId={route.courseId} initialSlide={route.slide} onExit={exitToHome} />;
  }
  return <PlatformHome onEnterChapter={enterChapter} />;
}
