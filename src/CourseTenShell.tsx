import { useMemo, useState } from 'react';
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
  { label: 'خاتمة الحقيبة ونشاط ما بعد الدورة', slides: htaClosingSlides },
];

/** Single-link (#/course/10) shell for التنظيم الاقتصادي: تقييم التقنيات
 *  الصحية, built on exactly the same shared course-2 components (sidebar +
 *  bare slide canvas + control strip) as #/course/4 through #/course/9 --
 *  see CourseThreeShell.tsx for the fuller comment on this shell's intent.
 *
 *  ⚠️ Sequential lock intentionally disabled: the client hasn't approved
 *  the script yet, so navigation is left fully open for review (no
 *  strictSequential/maxUnlockedIndex gating) instead of the per-slide
 *  unlock-as-you-go flow the other courses use.
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
      />
      <div className="min-w-0 flex-1">
        <CourseTwoPlayer
          key={`hta10-full-${jumpNonce}`}
          courseId="hta10-full"
          initialSlide={jumpTarget}
          onExit={exitToHome}
          onSlideChange={setActiveIndex}
        />
      </div>
    </div>
  );
}
