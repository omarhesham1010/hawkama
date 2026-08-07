import { useCallback, useEffect, useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import {
  emergencyIntroSlides,
  emergencyChapterOneSlides,
  emergencyChapterTwoSlides,
  emergencyChapterThreeSlides,
  emergencyChapterFourSlides,
} from './data/emergencyResponseProgram';

// Set only by `npm run build:sample` -- locks this shell to just the
// intro's first 2 slides in a single group, for the ministry-review
// sample package. See src/App.tsx for the matching routing lock.
const SAMPLE_MODE = import.meta.env.VITE_SAMPLE_MODE === 'true';
const COURSE_ID = SAMPLE_MODE ? 'emergency-sample' : 'emergency-full';
const LOCK_STORAGE_KEY = `course-lock-v1:${COURSE_ID}`;

// Chapter 4's own content -- including its own "ec4-quiz" -- stays in the
// chapter group; only the bag-wide post-test and final closing screen
// after it split into their own group so they get a standalone dropdown,
// mirroring how the intro ("مقدمة الحقيبة") is its own group rather than
// folded into ch.1.
const CH4_CLOSING_START = emergencyChapterFourSlides.findIndex((s) => s.id === 'emergency-post-test');
const chapterFourContent = emergencyChapterFourSlides.slice(0, CH4_CLOSING_START);
const chapterFourClosing = emergencyChapterFourSlides.slice(CH4_CLOSING_START);

const RAW_GROUPS: { label: string; slides: typeof emergencyIntroSlides }[] = SAMPLE_MODE
  ? [{ label: 'مقدمة الحقيبة', slides: emergencyIntroSlides.slice(0, 2) }]
  : [
      { label: 'مقدمة الحقيبة', slides: emergencyIntroSlides },
      { label: 'الفصل الأول', slides: emergencyChapterOneSlides },
      { label: 'الفصل الثاني', slides: emergencyChapterTwoSlides },
      { label: 'الفصل الثالث', slides: emergencyChapterThreeSlides },
      { label: 'الفصل الرابع', slides: chapterFourContent },
      { label: 'خاتمة الحقيبة والاختبار البعدي', slides: chapterFourClosing },
    ];

/** Single-link (#/course/2) shell. Exactly three things on screen: the
 *  collapsible right-side chapter menu, the bare rectangular slide (the
 *  same slide-deck engine used by #/bag/2/..., minus its background/header
 *  chrome), and a separate control strip below it. No top nav, no page
 *  background -- this is meant to be embedded (e.g. iframed) by whichever
 *  site hosts it. */
export default function CourseTwoShell() {
  const groups = useMemo<CourseTwoGroup[]>(() => {
    let offset = 0;
    return RAW_GROUPS.map((g) => {
      const group = { label: g.label, startIndex: offset, slides: g.slides };
      offset += g.slides.length;
      return group;
    });
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const [jumpTarget, setJumpTarget] = useState(1);
  const [jumpNonce, setJumpNonce] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unlockedSlideIds, setUnlockedSlideIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(LOCK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const slides = useMemo(() => groups.flatMap((group) => group.slides), [groups]);

  const maxUnlockedIndex = useMemo(() => {
    const unlocked = new Set(unlockedSlideIds);
    let nextLocked = 0;
    while (nextLocked < slides.length && unlocked.has(slides[nextLocked].id)) nextLocked += 1;
    return Math.min(nextLocked, Math.max(0, slides.length - 1));
  }, [slides, unlockedSlideIds]);

  useEffect(() => {
    window.localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(unlockedSlideIds));
  }, [unlockedSlideIds]);

  const unlockSlide = useCallback((id: string) => {
    setUnlockedSlideIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }, []);

  const resetUnlocks = useCallback(() => {
    setUnlockedSlideIds([]);
    window.localStorage.removeItem(LOCK_STORAGE_KEY);
  }, []);

  const jumpTo = (index: number) => {
    if (index > maxUnlockedIndex) return;
    setJumpTarget(index + 1);
    setJumpNonce((n) => n + 1);
    setActiveIndex(index);
  };

  const exitToHome = () => {
    window.location.hash = '#/';
  };

  return (
    <div dir="rtl" className="flex h-[100dvh] gap-3 overflow-hidden bg-canvas p-3">
      <CourseTwoSidebar
        groups={groups}
        activeIndex={activeIndex}
        onJump={jumpTo}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        maxUnlockedIndex={maxUnlockedIndex}
      />
      <div className="min-w-0 flex-1">
        <CourseTwoPlayer
          key={`${COURSE_ID}-${jumpNonce}`}
          courseId={COURSE_ID}
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
          strictSequential
          maxUnlockedIndex={maxUnlockedIndex}
          onUnlockSlide={unlockSlide}
          onResetSequentialLocks={resetUnlocks}
        />
      </div>
    </div>
  );
}
