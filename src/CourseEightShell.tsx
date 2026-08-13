import { useCallback, useEffect, useMemo, useState } from 'react';
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
  { label: 'خاتمة الحقيبة والاختبار الختامي', slides: eavClosingSlides },
];

const LOCK_STORAGE_KEY = 'course-lock-v1:econ8-full';

/** Single-link (#/course/8) shell for التحليل الاقتصادي والرعاية الصحية
 *  المبنية على القيمة, built on exactly the same shared course-2 components
 *  (sidebar + bare slide canvas + control strip) as #/course/4 through
 *  #/course/7 -- see CourseThreeShell.tsx for the fuller comment on this
 *  shell's intent. */
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
  const [unlockedSlideIds, setUnlockedSlideIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(LOCK_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const slides = useMemo(() => groups.flatMap((group) => group.slides), [groups]);

  const maxUnlockedIndex = useMemo(() => {
    const unlocked = new Set(unlockedSlideIds);
    let nextLocked = 0;
    while (nextLocked < slides.length && unlocked.has(slides[nextLocked].id)) nextLocked += 1;
    return Math.min(nextLocked, Math.max(0, slides.length - 1));
  }, [slides, unlockedSlideIds]);

  useEffect(() => {
    window.localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify(unlockedSlideIds));
  }, [unlockedSlideIds]);

  const unlockSlide = useCallback((id: string) => {
    setUnlockedSlideIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }, []);

  const resetUnlocks = useCallback(() => {
    setUnlockedSlideIds([]);
    window.localStorage.removeItem(LOCK_STORAGE_KEY);
  }, []);

  const jumpTo = (index: number) => {
    if (index > maxUnlockedIndex) return;
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
        maxUnlockedIndex={maxUnlockedIndex}
      />
      <div className="min-w-0 flex-1">
        <CourseTwoPlayer
          key={`econ8-full-${jumpNonce}`}
          courseId="econ8-full"
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
          strictSequential
          maxUnlockedIndex={maxUnlockedIndex}
          onUnlockSlide={unlockSlide}
          onResetSequentialLocks={resetUnlocks}
        />
      </div>
    </div>
  );
}
