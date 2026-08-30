import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import { useSequentialLock } from './hooks/useSequentialLock';
import {
  ceClosingSlides,
  ceIntroSlides,
  ceUnitFiveSlides,
  ceUnitFourSlides,
  ceUnitOneSlides,
  ceUnitThreeSlides,
  ceUnitTwoSlides,
} from './data/complianceEnforcementProgram';

const RAW_GROUPS: { label: string; slides: typeof ceIntroSlides }[] = [
  { label: 'مقدمة الحقيبة', slides: ceIntroSlides },
  { label: 'الوحدة الأولى · الأساس التنظيمي والأخلاقي للالتزام', slides: ceUnitOneSlides },
  { label: 'الوحدة الثانية · التفتيش القائم على المخاطر', slides: ceUnitTwoSlides },
  { label: 'الوحدة الثالثة · الفحص والتدقيق ومراقبة الامتثال', slides: ceUnitThreeSlides },
  { label: 'الوحدة الرابعة · الإنفاذ والتعامل مع القضايا', slides: ceUnitFourSlides },
  { label: 'الوحدة الخامسة · التقارير الرقابية والسياسات الصحية', slides: ceUnitFiveSlides },
  { label: 'خاتمة الحقيبة ونشاط ما بعد الدورة', slides: ceClosingSlides },
];

/** Single-link (#/course/11) shell for الرقابة والتفتيش والإنفاذ: الالتزام
 *  والمتابعة, built on exactly the same shared course-2 components (sidebar
 *  + bare slide canvas + control strip) as #/course/4 through #/course/10 --
 *  see CourseThreeShell.tsx for the fuller comment on this shell's intent.
 *
 *  Sequential lock: open for free review in this multi-course build (what
 *  hawkama.vercel.app deploys) and in local dev; ON (must finish each slide
 *  before the next unlocks) only in the standalone per-course SCORM package
 *  build -- see useSequentialLock and build-static.mjs's VITE_SEQUENTIAL_LOCK.
 *
 *  Audio: still pending client approval of the narration script
 *  (nasser-video-script-course11.docx) -- every audioKey below is real and
 *  ready, but no ElevenLabs narration has been generated yet, so every
 *  slide falls back to the browser's Web Speech API until the script is
 *  approved and audio is generated + synced into audioManifest.ts. */
export default function CourseElevenShell() {
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
          key={`ce11-full-${jumpNonce}`}
          courseId="ce11-full"
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
