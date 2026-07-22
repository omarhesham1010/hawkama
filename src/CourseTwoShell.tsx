import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import {
  emergencyIntroSlides,
  emergencyChapterOneSlides,
  emergencyChapterTwoSlides,
  emergencyChapterThreeSlides,
  emergencyChapterFourSlides,
} from './data/emergencyResponseProgram';

const RAW_GROUPS: { label: string; slides: typeof emergencyIntroSlides }[] = [
  { label: 'مقدمة الحقيبة', slides: emergencyIntroSlides },
  { label: 'الفصل الأول', slides: emergencyChapterOneSlides },
  { label: 'الفصل الثاني', slides: emergencyChapterTwoSlides },
  { label: 'الفصل الثالث', slides: emergencyChapterThreeSlides },
  { label: 'الفصل الرابع', slides: emergencyChapterFourSlides },
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
          key={`emergency-full-${jumpNonce}`}
          courseId="emergency-full"
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
        />
      </div>
    </div>
  );
}
