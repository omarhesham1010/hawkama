import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import {
  erpClosingSlides,
  erpIntroSlides,
  erpUnitFiveSlides,
  erpUnitFourSlides,
  erpUnitOneSlides,
  erpUnitThreeSlides,
  erpUnitTwoSlides,
} from './data/economicRegulationPricingProgram';

const RAW_GROUPS: { label: string; slides: typeof erpIntroSlides }[] = [
  { label: 'مقدمة الحقيبة', slides: erpIntroSlides },
  { label: 'الوحدة الأولى · الإطار التنظيمي والحوكمة', slides: erpUnitOneSlides },
  { label: 'الوحدة الثانية · التحليل الاقتصادي والمالي', slides: erpUnitTwoSlides },
  { label: 'الوحدة الثالثة · التكلفة والتسعير الصحي', slides: erpUnitThreeSlides },
  { label: 'الوحدة الرابعة · آليات التسعير الاسترشادي', slides: erpUnitFourSlides },
  { label: 'الوحدة الخامسة · أنظمة الدفع والتعويض', slides: erpUnitFiveSlides },
  { label: 'خاتمة الحقيبة والاختبار الختامي', slides: erpClosingSlides },
];

/** Single-link (#/course/9) shell for التنظيم الاقتصادي: التنافسية
 *  والشفافية وآليات التسعير والدفع, built on exactly the same shared
 *  course-2 components (sidebar + bare slide canvas + control strip) as
 *  #/course/4 through #/course/8 -- see CourseThreeShell.tsx for the
 *  fuller comment on this shell's intent.
 *
 *  ⚠️ Sequential lock intentionally disabled: navigation is left fully
 *  open for review (no strictSequential/maxUnlockedIndex gating). The
 *  "next slide" button still waits for narration/activity completion --
 *  see CourseTwoPlayer.tsx's canGoNext -- so this only affects free
 *  jump-to-any-slide sidebar navigation. */
export default function CourseNineShell() {
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
          key={`econ9-full-${jumpNonce}`}
          courseId="econ9-full"
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
        />
      </div>
    </div>
  );
}
