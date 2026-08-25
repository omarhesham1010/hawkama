import { useMemo, useState } from 'react';
import { CourseTwoSidebar, type CourseTwoGroup } from './components/course2/CourseTwoSidebar';
import { CourseTwoPlayer } from './components/course2/CourseTwoPlayer';
import { useSequentialLock } from './hooks/useSequentialLock';
import {
  governanceIntroSlides,
  governanceChapterOneSlides,
  governanceChapterTwoSlides,
  governanceChapterThreeSlides,
  governanceClosingSlides,
} from './course1/data/governanceProgram';

const RAW_GROUPS: { label: string; slides: typeof governanceIntroSlides }[] = [
  { label: 'مقدمة الحقيبة', slides: governanceIntroSlides },
  { label: 'الفصل الأول · الحوكمة التنظيمية والامتثال', slides: governanceChapterOneSlides },
  { label: 'الفصل الثاني · الامتثال والتدقيق والضوابط', slides: governanceChapterTwoSlides },
  { label: 'الفصل الثالث · إدارة المخاطر المؤسسية', slides: governanceChapterThreeSlides },
  { label: 'خاتمة الحقيبة ونشاط ما بعد الدورة', slides: governanceClosingSlides },
];

/** Single-link (#/course/1) shell for الحوكمة والمخاطر والامتثال, built on
 *  exactly the same shared course-2 components (sidebar + bare slide canvas
 *  + control strip) as #/course/2 and #/course/3 -- see CourseTwoShell.tsx
 *  for the fuller comment on this shell's intent.
 *
 *  Deliberately reads from ./course1/data/governanceProgram.ts, a full fork
 *  of src/data/governanceProgram.ts, not the shared file bag/1 uses -- the
 *  client wants course/1's content (rewritten into formal Arabic) to evolve
 *  independently, so /bag/1/... keeps rendering exactly as it does today.
 *
 *  Sequential lock: open for free review in this multi-course build (what
 *  hawkama.vercel.app deploys) and in local dev; ON (must finish each slide
 *  before the next unlocks) only in the standalone per-course SCORM package
 *  build -- see useSequentialLock and build-static.mjs's VITE_SEQUENTIAL_LOCK. */
export default function CourseOneShell() {
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
          key={`governance-full-${jumpNonce}`}
          courseId="governance-full"
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
