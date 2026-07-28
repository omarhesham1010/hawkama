import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import { emergencyIntroSlides } from './data/emergencyResponseProgram';

const COURSE_ID = 'emergency-demo';

const RAW_GROUPS: { label: string; slides: typeof emergencyIntroSlides }[] = [
  { label: 'مقدمة الحقيبة', slides: emergencyIntroSlides },
];

/** Client-facing teaser link (#/advcourse/2): identical shell to #/course/2
 *  (same components, same styling, same player) but locked to the bag's
 *  first 3 slides only, so it can be shown to prospective clients without
 *  exposing the rest of the course. Mirrors CourseTwoShell.tsx exactly --
 *  do not diverge the two beyond the slide set and courseId below. */
export default function AdvCourseTwoShell() {
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
      />
      <div className="min-w-0 flex-1">
        <CourseTwoPlayer
          key={`${COURSE_ID}-${jumpNonce}`}
          courseId={COURSE_ID}
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
        />
      </div>
    </div>
  );
}
