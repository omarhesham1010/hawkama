import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import {
  governance2ClosingSlides,
  governance2IntroSlides,
  governance2UnitFiveSlides,
  governance2UnitFourSlides,
  governance2UnitOneSlides,
  governance2UnitThreeSlides,
  governance2UnitTwoSlides,
} from './data/governance2Program';

const RAW_GROUPS: { label: string; slides: typeof governance2IntroSlides }[] = [
  { label: 'مقدمة الحقيبة', slides: governance2IntroSlides },
  { label: 'الوحدة الأولى · الأسس الاستراتيجية لحوكمة القطاع الصحي', slides: governance2UnitOneSlides },
  { label: 'الوحدة الثانية · تصميم أطر الحوكمة ونماذج التشغيل', slides: governance2UnitTwoSlides },
  { label: 'الوحدة الثالثة · الحوكمة التشغيلية وإدارة الأداء والجودة', slides: governance2UnitThreeSlides },
  { label: 'الوحدة الرابعة · إدارة التغيير والمخاطر والشراكات', slides: governance2UnitFourSlides },
  { label: 'الوحدة الخامسة · الحوكمة المتقدمة واتخاذ القرار', slides: governance2UnitFiveSlides },
  { label: 'خاتمة الحقيبة والاختبار الختامي', slides: governance2ClosingSlides },
];

/** Single-link (#/course/5) shell for حوكمة القطاع الصحي, built on exactly
 *  the same shared course-2 components (sidebar + bare slide canvas +
 *  control strip) as #/course/3 -- see CourseThreeShell.tsx for the fuller
 *  comment on this shell's intent.
 *
 *  ⚠️ Sequential lock intentionally disabled: navigation is left fully
 *  open for review (no strictSequential/maxUnlockedIndex gating). The
 *  "next slide" button still waits for narration/activity completion --
 *  see CourseTwoPlayer.tsx's canGoNext -- so this only affects free
 *  jump-to-any-slide sidebar navigation. */
export default function CourseFiveShell() {
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
          key={`governance2-full-${jumpNonce}`}
          courseId="governance2-full"
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
        />
      </div>
    </div>
  );
}
