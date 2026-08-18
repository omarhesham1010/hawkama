import { useCallback, useEffect, useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import {
  htaClosingSlides,
  htaIntroSlides,
  htaUnitFiveSlides,
  htaUnitFourSlides,
  htaUnitOneSlides,
  htaUnitThreeSlides,
  htaUnitTwoSlides,
} from './data/healthTechAssessmentProgram';

const RAW_GROUPS: { label: string; slides: typeof htaIntroSlides }[] = [
  { label: 'مقدمة الحقيبة', slides: htaIntroSlides },
  { label: 'الوحدة الأولى · الإطار العام والتحول الرقمي', slides: htaUnitOneSlides },
  { label: 'الوحدة الثانية · المعلوماتية الصحية وإدارة البيانات', slides: htaUnitTwoSlides },
  { label: 'الوحدة الثالثة · التشغيل البيني والمعايير الصحية', slides: htaUnitThreeSlides },
  { label: 'الوحدة الرابعة · الأمن السيبراني والخصوصية والثقة', slides: htaUnitFourSlides },
  { label: 'الوحدة الخامسة · الأطر القانونية، الأخلاقيات، والتعاون', slides: htaUnitFiveSlides },
  { label: 'خاتمة الحقيبة والاختبار الختامي', slides: htaClosingSlides },
];

const LOCK_STORAGE_KEY = 'course-lock-v1:hta10-full';

/** Single-link (#/course/10) shell for التنظيم الاقتصادي: تقييم التقنيات
 *  الصحية, built on exactly the same shared course-2 components (sidebar +
 *  bare slide canvas + control strip) as #/course/4 through #/course/9 --
 *  see CourseThreeShell.tsx for the fuller comment on this shell's intent.
 *
 *  ⚠️ Audio: this course's narration script is still pending client
 *  approval (see docs/nasser-video-script-course10.docx), so no
 *  ElevenLabs audio has been generated yet -- every slide's audioKey
 *  simply falls through to the browser's Web Speech API until real
 *  .mp3s are recorded and added to public/audio + audioManifest.ts. */
export default function CourseTenShell() {
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
          key={`hta10-full-${jumpNonce}`}
          courseId="hta10-full"
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
