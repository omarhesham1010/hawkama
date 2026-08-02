import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import {
  licensingClosingSlides,
  licensingIntroSlides,
  licensingUnitFiveSlides,
  licensingUnitFourSlides,
  licensingUnitOneSlides,
  licensingUnitThreeSlides,
  licensingUnitTwoSlides,
} from './data/licensingProgram';

const RAW_GROUPS: { label: string; slides: typeof licensingIntroSlides }[] = [
  { label: 'مقدمة الحقيبة', slides: licensingIntroSlides },
  { label: 'الوحدة الأولى · البيانات والأداء واتخاذ القرار', slides: licensingUnitOneSlides },
  { label: 'الوحدة الثانية · سوق العمل وأصحاب المصلحة', slides: licensingUnitTwoSlides },
  { label: 'الوحدة الثالثة · الإطار التنظيمي وحوكمة التراخيص', slides: licensingUnitThreeSlides },
  { label: 'الوحدة الرابعة · المخاطر والسياسات الداعمة للتراخيص', slides: licensingUnitFourSlides },
  { label: 'الوحدة الخامسة · التفتيش والتقارير والرقابة', slides: licensingUnitFiveSlides },
  { label: 'خاتمة الحقيبة والاختبار الختامي', slides: licensingClosingSlides },
];

/** Single-link (#/course/3) shell for ترخيص المنشآت الصحية والقوى العاملة,
 *  built on exactly the same shared course-2 components (sidebar + bare
 *  slide canvas + control strip) as #/course/2 -- see CourseTwoShell.tsx
 *  for the fuller comment on this shell's intent. */
export default function CourseThreeShell() {
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
    <div dir="rtl" className="course-three-shell flex h-[100dvh] gap-3 overflow-hidden bg-canvas p-3">
      <CourseTwoSidebar
        groups={groups}
        activeIndex={activeIndex}
        onJump={jumpTo}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />
      <div className="min-w-0 flex-1">
        <CourseTwoPlayer
          key={`licensing-full-${jumpNonce}`}
          courseId="licensing-full"
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
        />
      </div>
    </div>
  );
}
