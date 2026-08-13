import { useCallback, useEffect, useMemo, useState } from 'react';
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

const LOCK_STORAGE_KEY = 'course-lock-v1:econ9-full';

/** Single-link (#/course/9) shell for التنظيم الاقتصادي: التنافسية
 *  والشفافية وآليات التسعير والدفع, built on exactly the same shared
 *  course-2 components (sidebar + bare slide canvas + control strip) as
 *  #/course/4 through #/course/8 -- see CourseThreeShell.tsx for the
 *  fuller comment on this shell's intent. */
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

  // Temporarily unlocked for client review (2026-08-13) -- set back to
  // `false` (or delete this override and use `maxUnlockedIndex` directly
  // below) when the review pass is done to restore the sequential lock.
  const TEMP_UNLOCK_ALL = true;
  const effectiveMaxUnlockedIndex = TEMP_UNLOCK_ALL ? Math.max(0, slides.length - 1) : maxUnlockedIndex;

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
    if (index > effectiveMaxUnlockedIndex) return;
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
        maxUnlockedIndex={effectiveMaxUnlockedIndex}
      />
      <div className="min-w-0 flex-1">
        <CourseTwoPlayer
          key={`econ9-full-${jumpNonce}`}
          courseId="econ9-full"
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
          // Temporarily unlocked for client review (2026-08-13) -- restore
          // `strictSequential` (no ={false}) when the review pass is done.
          strictSequential={false}
          maxUnlockedIndex={effectiveMaxUnlockedIndex}
          onUnlockSlide={unlockSlide}
          onResetSequentialLocks={resetUnlocks}
        />
      </div>
    </div>
  );
}
