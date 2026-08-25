import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import { useSequentialLock } from './hooks/useSequentialLock';
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
      { label: 'خاتمة الحقيبة ونشاط ما بعد الدورة', slides: chapterFourClosing },
    ];

/** Single-link (#/course/2) shell. Exactly three things on screen: the
 *  collapsible right-side chapter menu, the bare rectangular slide (the
 *  same slide-deck engine used by #/bag/2/..., minus its background/header
 *  chrome), and a separate control strip below it. No top nav, no page
 *  background -- this is meant to be embedded (e.g. iframed) by whichever
 *  site hosts it.
 *
 *  Sequential lock: open for free review in this multi-course build (what
 *  hawkama.vercel.app deploys) and in local dev; ON (must finish each slide
 *  before the next unlocks) only in the standalone per-course SCORM package
 *  build -- see useSequentialLock and build-static.mjs's VITE_SEQUENTIAL_LOCK. */
export default function CourseTwoShell() {
  const groups = useMemo<CourseTwoGroup[]>(() => {
    let offset = 0;
    return RAW_GROUPS.map((g) => {
      const group = { label: g.label, startIndex: offset, slides: g.slides };
      offset += g.slides.length;
      return group;
    });
  }, []);
  const lock = useSequentialLock(groups);

  const [activeIndex, setActiveIndex] = useState(0);
  const [jumpTarget, setJumpTarget] = useState(1);
  const [jumpNonce, setJumpNonce] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const jumpTo = (index: number) => {
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
        maxUnlockedIndex={lock.maxUnlockedIndex}
      />
      <div className="min-w-0 flex-1">
        <CourseTwoPlayer
          key={`${COURSE_ID}-${jumpNonce}`}
          courseId={COURSE_ID}
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
          strictSequential={lock.enabled}
          maxUnlockedIndex={lock.maxUnlockedIndex}
          onUnlockSlide={lock.onUnlockSlide}
          onResetSequentialLocks={lock.onResetSequentialLocks}
        />
      </div>
    </div>
  );
}
