import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useNarrationContext } from './components/audio/NarrationContext';
import { PlatformHome } from './components/platform/PlatformHome';
import { PersonalizationGate } from './components/platform/PersonalizationGate';
import { useLearnerProfile } from './hooks/useLearnerProfile';
import { courseHash, courseIdFromLocation } from './lib/courseRoutes';
import { platform } from './data/platformContent';
import { stopVoiceClip } from './lib/playVoiceClip';

const SlidePlayer = lazy(() => import('./SlidePlayer'));
const CourseTwoShell = lazy(() => import('./CourseTwoShell'));
const CourseThreeShell = lazy(() => import('./CourseThreeShell'));

interface Route {
  view: 'home' | 'course' | 'course2' | 'course3';
  courseId: string;
  slide: number; // 1-based
}

/** Set only by `npm run build:sample` -- produces a build locked to the
 *  2-slide ministry-review sample, using the same course-2 shell (green
 *  chrome, hamburger sidebar, no personalization gate) as the real
 *  #/course/2 link, regardless of URL/hash, so a reviewer can never
 *  navigate into the rest of the (in-progress) platform. */
const SAMPLE_MODE = import.meta.env.VITE_SAMPLE_MODE === 'true';

function parseHash(): Route {
  if (SAMPLE_MODE) {
    return { view: 'course2', courseId: 'course-2', slide: 1 };
  }
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  // New in-progress build for bag 2, kept fully separate from the legacy
  // #/bag/2/... routes below so the old content stays reachable/shareable
  // while this one is worked on.
  if (parts[0] === 'course' && parts[1] === '2') {
    return { view: 'course2', courseId: 'course-2', slide: 1 };
  }
  if (parts[0] === 'course' && parts[1] === '3') {
    return { view: 'course3', courseId: 'course-3', slide: 1 };
  }
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
  const { profile, saveProfile } = useLearnerProfile();

  useEffect(() => {
    if (route.view !== 'course') return;
    const canonical = courseHash(route.courseId, route.slide);
    if (window.location.hash !== canonical) window.history.replaceState(null, '', canonical);
  }, [route]);

  // Tab title mirrors the current bag's title while inside a slide, and
  // reverts to a generic title on the home platform view.
  useEffect(() => {
    if (route.view !== 'course') {
      document.title = 'حقيبة تدريبية تفاعلية';
      return;
    }
    const trackId = route.courseId.startsWith('emergency') ? 'emergency-response' : 'governance';
    const track = platform.tracks.find((t) => t.id === trackId);
    document.title = track ? `${track.title} | حقيبة تدريبية تفاعلية` : 'حقيبة تدريبية تفاعلية';
  }, [route.view, route.courseId]);

  // Keep the view in sync with the URL so links are shareable / deep-linkable.
  useEffect(() => {
    const onHash = () => {
      narration.stop();
      stopVoiceClip();
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

  if (route.view === 'course2') {
    return (
      <Suspense fallback={null}>
        <CourseTwoShell />
      </Suspense>
    );
  }

  if (route.view === 'course3') {
    return (
      <Suspense fallback={null}>
        <CourseThreeShell />
      </Suspense>
    );
  }

  if (!profile) {
    return <PersonalizationGate onDone={saveProfile} />;
  }

  if (route.view === 'course') {
    return (
      <Suspense fallback={<CourseLoader />}>
        <SlidePlayer key={route.courseId} courseId={route.courseId} initialSlide={route.slide} onExit={exitToHome} />
      </Suspense>
    );
  }
  return <PlatformHome onEnterChapter={enterChapter} />;
}

function CourseLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6 text-center text-brand-strong" dir="rtl">
      <div className="rounded-2xl border border-brand/15 bg-white/90 px-8 py-7 shadow-card">
        <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-brand/15 border-t-brand" />
        <p className="text-lg font-extrabold">جاري تجهيز الفصل...</p>
        <p className="mt-2 text-sm font-semibold text-ink-soft">بنحمّل ملفات الفصل المطلوب فقط.</p>
      </div>
    </div>
  );
}
