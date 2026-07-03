import { useCallback, useEffect, useState } from 'react';
import { useNarrationContext } from './components/audio/NarrationContext';
import { PlatformHome } from './components/platform/PlatformHome';
import SlidePlayer from './SlidePlayer';

interface Route {
  view: 'home' | 'course';
  slide: number; // 1-based
}

function parseHash(): Route {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'course') {
    const n = parseInt(parts[1] || '1', 10);
    return { view: 'course', slide: Number.isNaN(n) ? 1 : n };
  }
  return { view: 'home', slide: 1 };
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
    if (courseId !== 'governance-ch1') return;
    window.location.hash = '#/course/1';
  }, []);

  const exitToHome = useCallback(() => {
    window.location.hash = '#/';
  }, []);

  if (route.view === 'course') {
    return <SlidePlayer initialSlide={route.slide} onExit={exitToHome} />;
  }
  return <PlatformHome onEnterChapter={enterChapter} />;
}
