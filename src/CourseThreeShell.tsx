import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import { useSequentialLock } from './hooks/useSequentialLock';
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
  { label: 'خاتمة الحقيبة ونشاط ما بعد الدورة', slides: licensingClosingSlides },
];

/** Single-link (#/course/3) shell for ترخيص المنشآت الصحية والقوى العاملة,
 *  built on exactly the same shared course-2 components (sidebar + bare
 *  slide canvas + control strip) as #/course/2 -- see CourseTwoShell.tsx
 *  for the fuller comment on this shell's intent.
 *
 *  Sequential lock: open for free review in this multi-course build (what
 *  hawkama.vercel.app deploys) and in local dev; ON (must finish each slide
 *  before the next unlocks) only in the standalone per-course SCORM package
 *  build -- see useSequentialLock and build-static.mjs's VITE_SEQUENTIAL_LOCK. */
export default function CourseThreeShell() {
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
          key={`licensing-full-${jumpNonce}`}
          courseId="licensing-full"
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
