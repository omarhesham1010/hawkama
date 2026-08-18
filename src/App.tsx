import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useNarrationContext } from './components/audio/NarrationContext';
import { PlatformHome } from './components/platform/PlatformHome';
import { PersonalizationGate } from './components/platform/PersonalizationGate';
import { useLearnerProfile } from './hooks/useLearnerProfile';
import { courseHash, courseIdFromLocation } from './lib/courseRoutes';
import { platform } from './data/platformContent';
import { stopVoiceClip } from './lib/playVoiceClip';

const SlidePlayer = lazy(() => import('./SlidePlayer'));
const CourseOneShell = lazy(() => import('./CourseOneShell'));
const CourseTwoShell = lazy(() => import('./CourseTwoShell'));
const CourseThreeShell = lazy(() => import('./CourseThreeShell'));
const CourseFourShell = lazy(() => import('./CourseFourShell'));
const CourseFiveShell = lazy(() => import('./CourseFiveShell'));
const CourseSixShell = lazy(() => import('./CourseSixShell'));
const CourseSevenShell = lazy(() => import('./CourseSevenShell'));
const CourseEightShell = lazy(() => import('./CourseEightShell'));
const CourseNineShell = lazy(() => import('./CourseNineShell'));
const CourseTenShell = lazy(() => import('./CourseTenShell'));
const AdvCourseTwoShell = lazy(() => import('./AdvCourseTwoShell'));

interface Route {
  view: 'home' | 'course' | 'course1' | 'course2' | 'course3' | 'course4' | 'course5' | 'course6' | 'course7' | 'course8' | 'course9' | 'course10' | 'advcourse2';
  courseId: string;
  slide: number; // 1-based
}

/** Set only by `npm run build:sample` -- produces a build locked to the
 *  2-slide ministry-review sample, using the same course-2 shell (green
 *  chrome, hamburger sidebar, no personalization gate) as the real
 *  #/course/2 link, regardless of URL/hash, so a reviewer can never
 *  navigate into the rest of the (in-progress) platform. */
const SAMPLE_MODE = import.meta.env.VITE_SAMPLE_MODE === 'true';
/** Set only by `npm run build:course1`/`:course2`/`:course3` -- same lock
 *  pattern as SAMPLE_MODE above, but for a standalone single-course SCORM
 *  delivery: the app always boots straight into that one course's shell,
 *  regardless of URL/hash, so the ministry-delivered package for one
 *  "حقيبة" can never navigate into the multi-course platform home or any
 *  other course (which also isn't in the package -- see build-static.mjs's
 *  --course audio pruning). */
const SINGLE_COURSE = import.meta.env.VITE_SINGLE_COURSE || '';

function parseHash(): Route {
  if (SAMPLE_MODE) {
    return { view: 'course2', courseId: 'course-2', slide: 1 };
  }
  if (SINGLE_COURSE) {
    return { view: SINGLE_COURSE as Route['view'], courseId: `course-${SINGLE_COURSE.slice(-1)}`, slide: 1 };
  }
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  const parts = h.split('/').filter(Boolean);
  // New in-progress build for bag 2, kept fully separate from the legacy
  // #/bag/2/... routes below so the old content stays reachable/shareable
  // while this one is worked on.
  if (parts[0] === 'course' && parts[1] === '1') {
    return { view: 'course1', courseId: 'course-1', slide: 1 };
  }
  if (parts[0] === 'course' && parts[1] === '2') {
    return { view: 'course2', courseId: 'course-2', slide: 1 };
  }
  // Client-facing teaser link -- same shell as #/course/2, locked to the
  // bag's first 3 slides only. See src/AdvCourseTwoShell.tsx.
  if (parts[0] === 'advcourse' && parts[1] === '2') {
    return { view: 'advcourse2', courseId: 'advcourse-2', slide: 1 };
  }
  if (parts[0] === 'course' && parts[1] === '3') {
    return { view: 'course3', courseId: 'course-3', slide: 1 };
  }
  if (parts[0] === 'course' && parts[1] === '4') {
    return { view: 'course4', courseId: 'course-4', slide: 1 };
  }
  if (parts[0] === 'course' && parts[1] === '5') {
    return { view: 'course5', courseId: 'course-5', slide: 1 };
  }
  if (parts[0] === 'course' && parts[1] === '6') {
    return { view: 'course6', courseId: 'course-6', slide: 1 };
  }
  if (parts[0] === 'course' && parts[1] === '7') {
    return { view: 'course7', courseId: 'course-7', slide: 1 };
  }
  if (parts[0] === 'course' && parts[1] === '8') {
    return { view: 'course8', courseId: 'course-8', slide: 1 };
  }
  if (parts[0] === 'course' && parts[1] === '9') {
    return { view: 'course9', courseId: 'course-9', slide: 1 };
  }
  if (parts[0] === 'course' && parts[1] === '10') {
    return { view: 'course10', courseId: 'course-10', slide: 1 };
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

  if (route.view === 'course1') {
    return (
      <Suspense fallback={null}>
        <CourseOneShell />
      </Suspense>
    );
  }

  if (route.view === 'course2') {
    return (
      <Suspense fallback={null}>
        <CourseTwoShell />
      </Suspense>
    );
  }

  if (route.view === 'advcourse2') {
    return (
      <Suspense fallback={null}>
        <AdvCourseTwoShell />
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

  if (route.view === 'course4') {
    return (
      <Suspense fallback={null}>
        <CourseFourShell />
      </Suspense>
    );
  }

  if (route.view === 'course5') {
    return (
      <Suspense fallback={null}>
        <CourseFiveShell />
      </Suspense>
    );
  }

  if (route.view === 'course6') {
    return (
      <Suspense fallback={null}>
        <CourseSixShell />
      </Suspense>
    );
  }

  if (route.view === 'course7') {
    return (
      <Suspense fallback={null}>
        <CourseSevenShell />
      </Suspense>
    );
  }

  if (route.view === 'course8') {
    return (
      <Suspense fallback={null}>
        <CourseEightShell />
      </Suspense>
    );
  }

  if (route.view === 'course9') {
    return (
      <Suspense fallback={null}>
        <CourseNineShell />
      </Suspense>
    );
  }

  if (route.view === 'course10') {
    return (
      <Suspense fallback={null}>
        <CourseTenShell />
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
