import { useCallback, useEffect, useMemo, useState } from 'react';
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

const LOCK_STORAGE_KEY = 'course-lock-v1:licensing-full';

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
          key={`licensing-full-${jumpNonce}`}
          courseId="licensing-full"
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
