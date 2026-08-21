import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import {
  eavClosingSlides,
  eavIntroSlides,
  eavUnitFiveSlides,
  eavUnitFourSlides,
  eavUnitOneSlides,
  eavUnitThreeSlides,
  eavUnitTwoSlides,
} from './data/economicAnalysisValueProgram';

const RAW_GROUPS: { label: string; slides: typeof eavIntroSlides }[] = [
  { label: 'مقدمة الحقيبة', slides: eavIntroSlides },
  { label: 'الوحدة الأولى · التنبؤ الاكتواري وإدارة المخاطر المؤسسية', slides: eavUnitOneSlides },
  { label: 'الوحدة الثانية · تدقيق المطالبات والالتزام التنظيمي والأخلاقيات', slides: eavUnitTwoSlides },
  { label: 'الوحدة الثالثة · التفاوض والتعاقد في القطاع الصحي', slides: eavUnitThreeSlides },
  { label: 'الوحدة الرابعة · الرعاية الصحية المبنية على القيمة', slides: eavUnitFourSlides },
  { label: 'الوحدة الخامسة · الأداء والتقارير واتخاذ القرار', slides: eavUnitFiveSlides },
  { label: 'خاتمة الحقيبة ونشاط ما بعد الدورة', slides: eavClosingSlides },
];

/** Single-link (#/course/8) shell for التحليل الاقتصادي والرعاية الصحية
 *  المبنية على القيمة, built on exactly the same shared course-2 components
 *  (sidebar + bare slide canvas + control strip) as #/course/4 through
 *  #/course/7 -- see CourseThreeShell.tsx for the fuller comment on this
 *  shell's intent.
 *
 *  ⚠️ Sequential lock intentionally disabled: navigation is left fully
 *  open for review (no strictSequential/maxUnlockedIndex gating). The
 *  "next slide" button still waits for narration/activity completion --
 *  see CourseTwoPlayer.tsx's canGoNext -- so this only affects free
 *  jump-to-any-slide sidebar navigation. */
export default function CourseEightShell() {
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
          key={`econ8-full-${jumpNonce}`}
          courseId="econ8-full"
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
        />
      </div>
    </div>
  );
}
