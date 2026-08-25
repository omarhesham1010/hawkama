import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import { useSequentialLock } from './hooks/useSequentialLock';
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
  { label: 'خاتمة الحقيبة ونشاط ما بعد الدورة', slides: governance2ClosingSlides },
];

/** Single-link (#/course/5) shell for حوكمة القطاع الصحي, built on exactly
 *  the same shared course-2 components (sidebar + bare slide canvas +
 *  control strip) as #/course/3 -- see CourseThreeShell.tsx for the fuller
 *  comment on this shell's intent.
 *
 *  Sequential lock: open for free review in this multi-course build (what
 *  hawkama.vercel.app deploys) and in local dev; ON (must finish each slide
 *  before the next unlocks) only in the standalone per-course SCORM package
 *  build -- see useSequentialLock and build-static.mjs's VITE_SEQUENTIAL_LOCK. */
export default function CourseFiveShell() {
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
          key={`governance2-full-${jumpNonce}`}
          courseId="governance2-full"
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
