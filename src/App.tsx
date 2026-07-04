import { useCallback, useEffect, useState } from 'react';
import { useNarrationContext } from './components/audio/NarrationContext';
import { PlatformHome } from './components/platform/PlatformHome';
import SlidePlayer from './SlidePlayer';

interface Route {
  view: 'home' | 'course';
  courseId: string;
  slide: number; // 1-based
}

function parseHash(): Route {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'course') {
    const legacySlide = parseInt(parts[1] || '1', 10);
    if (!Number.isNaN(legacySlide)) {
      return { view: 'course', courseId: 'governance-ch1', slide: legacySlide };
    }
    const courseId = parts[1] || 'governance-ch1';
    const n = parseInt(parts[2] || '1', 10);
    return { view: 'course', courseId, slide: Number.isNaN(n) ? 1 : n };
  }
  return { view: 'home', courseId: 'governance-ch1', slide: 1 };
}

export default function App() {
  const narration = useNarrationContext();
  const [route, setRoute] = useState<Route>(() => parseHash());

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
    window.location.hash = `#/course/${courseId}/1`;
  }, []);

  const exitToHome = useCallback(() => {
    window.location.hash = '#/';
  }, []);

  if (route.view === 'course') {
    return <SlidePlayer key={route.courseId} courseId={route.courseId} initialSlide={route.slide} onExit={exitToHome} />;
  }
  return <PlatformHome onEnterChapter={enterChapter} />;
}
