import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import { useSequentialLock } from './hooks/useSequentialLock';
import {
  policyClosingSlides,
  policyIntroSlides,
  policyUnitFiveSlides,
  policyUnitFourSlides,
  policyUnitOneSlides,
  policyUnitThreeSlides,
  policyUnitTwoSlides,
} from './data/policyProgram';

const RAW_GROUPS: { label: string; slides: typeof policyIntroSlides }[] = [
  { label: 'مقدمة الحقيبة', slides: policyIntroSlides },
  { label: 'الوحدة الأولى · الإطار العام وصناعة السياسات', slides: policyUnitOneSlides },
  { label: 'الوحدة الثانية · أصحاب المصلحة والمشاورات', slides: policyUnitTwoSlides },
  { label: 'الوحدة الثالثة · التحليل المتقدم وصياغة السياسات', slides: policyUnitThreeSlides },
  { label: 'الوحدة الرابعة · الجوانب القانونية والتشريعية', slides: policyUnitFourSlides },
  { label: 'الوحدة الخامسة · الحوكمة والمخاطر واتخاذ القرار', slides: policyUnitFiveSlides },
  { label: 'خاتمة الحقيبة ونشاط ما بعد الدورة', slides: policyClosingSlides },
];

/** Single-link (#/course/4) shell for إعداد السياسات والأنظمة واللوائح في
 *  القطاع الصحي, built on exactly the same shared course-2 components
 *  (sidebar + bare slide canvas + control strip) as #/course/3 -- see
 *  CourseThreeShell.tsx for the fuller comment on this shell's intent.
 *
 *  Sequential lock: open for free review in this multi-course build (what
 *  hawkama.vercel.app deploys) and in local dev; ON (must finish each slide
 *  before the next unlocks) only in the standalone per-course SCORM package
 *  build -- see useSequentialLock and build-static.mjs's VITE_SEQUENTIAL_LOCK. */
export default function CourseFourShell() {
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
          key={`policy-full-${jumpNonce}`}
          courseId="policy-full"
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
