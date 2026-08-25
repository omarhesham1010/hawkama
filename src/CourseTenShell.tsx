import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import { useSequentialLock } from './hooks/useSequentialLock';
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
  { label: 'خاتمة الحقيبة ونشاط ما بعد الدورة', slides: htaClosingSlides },
];

/** Single-link (#/course/10) shell for التنظيم الاقتصادي: تقييم التقنيات
 *  الصحية, built on exactly the same shared course-2 components (sidebar +
 *  bare slide canvas + control strip) as #/course/4 through #/course/9 --
 *  see CourseThreeShell.tsx for the fuller comment on this shell's intent.
 *
 *  Sequential lock: open for free review in this multi-course build (what
 *  hawkama.vercel.app deploys) and in local dev; ON (must finish each slide
 *  before the next unlocks) only in the standalone per-course SCORM package
 *  build -- see useSequentialLock and build-static.mjs's VITE_SEQUENTIAL_LOCK.
 *
 *  Audio: the client-approved script (nasser-video-script-course10-revised-
 *  fusha.docx) is fully applied and every audioKey has real ElevenLabs
 *  narration -- no Web Speech API fallback in normal use. */
export default function CourseTenShell() {
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
          key={`hta10-full-${jumpNonce}`}
          courseId="hta10-full"
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
