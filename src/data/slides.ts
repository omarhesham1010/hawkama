import { course as governanceCourse } from './courseContent';
import {
  governanceChapterOneSlides,
  governanceChapterThreeSlides,
  governanceChapterTwoSlides,
  governanceIntroSlides,
  governanceProgramSlides,
} from './governanceProgram';
import {
  emergencyChapterFourSlides,
  emergencyChapterOneSlides,
  emergencyChapterThreeSlides,
  emergencyChapterTwoSlides,
  emergencyIntroSlides,
} from './emergencyResponseProgram';
// The legacy /bag/2/chapter/N/slide/S route must keep rendering its
// pre-course/2 content (text, audio keys, everything) while #/course/2
// keeps the current data above -- see src/legacy-bag2/data/emergencyResponseProgram.ts.
import {
  emergencyChapterFourSlides as emergencyChapterFourSlidesLegacy,
  emergencyChapterOneSlides as emergencyChapterOneSlidesLegacy,
  emergencyChapterThreeSlides as emergencyChapterThreeSlidesLegacy,
  emergencyChapterTwoSlides as emergencyChapterTwoSlidesLegacy,
  emergencyIntroSlides as emergencyIntroSlidesLegacy,
} from '../legacy-bag2/data/emergencyResponseProgram';
// The single-link #/course/1 shell reads from its own fork of the
// governance data (rewritten into formal Arabic), kept fully separate so
// /bag/1/chapter/N/slide/S keeps rendering the shared file above untouched
// -- see src/course1/data/governanceProgram.ts.
import {
  governanceChapterOneSlides as governanceChapterOneSlidesCourse1,
  governanceChapterThreeSlides as governanceChapterThreeSlidesCourse1,
  governanceChapterTwoSlides as governanceChapterTwoSlidesCourse1,
  governanceClosingSlides as governanceClosingSlidesCourse1,
  governanceIntroSlides as governanceIntroSlidesCourse1,
} from '../course1/data/governanceProgram';
import {
  licensingClosingSlides,
  licensingIntroSlides,
  licensingUnitFiveSlides,
  licensingUnitFourSlides,
  licensingUnitOneSlides,
  licensingUnitThreeSlides,
  licensingUnitTwoSlides,
} from './licensingProgram';
import {
  policyClosingSlides,
  policyIntroSlides,
  policyUnitFiveSlides,
  policyUnitFourSlides,
  policyUnitOneSlides,
  policyUnitThreeSlides,
  policyUnitTwoSlides,
} from './policyProgram';
import {
  governance2ClosingSlides,
  governance2IntroSlides,
  governance2UnitFiveSlides,
  governance2UnitFourSlides,
  governance2UnitOneSlides,
  governance2UnitThreeSlides,
  governance2UnitTwoSlides,
} from './governance2Program';
import {
  perfClosingSlides,
  perfIntroSlides,
  perfUnitFiveSlides,
  perfUnitFourSlides,
  perfUnitOneSlides,
  perfUnitThreeSlides,
  perfUnitTwoSlides,
} from './systemPerformanceProgram';
import {
  qualClosingSlides,
  qualIntroSlides,
  qualUnitFiveSlides,
  qualUnitFourSlides,
  qualUnitOneSlides,
  qualUnitThreeSlides,
  qualUnitTwoSlides,
} from './qualityMonitoringProgram';
import { courseMeta as legacyCourseMeta, slides as legacySlides } from './legacySlides';
import type { Slide } from '../types/slides';
import { course1AudioScriptText } from './course1AudioScriptOverrides';

function withCourse1AudioScriptOverrides(slides: Slide[]) {
  return slides.map((slide) => {
    const narration = course1AudioScriptText(slide.audioKey, slide.narration);
    if (narration === slide.narration) return slide;
    return {
      ...slide,
      narration,
      duration: Math.max(10, Math.ceil(narration.length / 10.5)),
    };
  });
}

const governanceIntroSlidesCourse1Synced = withCourse1AudioScriptOverrides(governanceIntroSlidesCourse1);
const governanceChapterOneSlidesCourse1Synced = withCourse1AudioScriptOverrides(governanceChapterOneSlidesCourse1);
const governanceChapterTwoSlidesCourse1Synced = withCourse1AudioScriptOverrides(governanceChapterTwoSlidesCourse1);
const governanceChapterThreeSlidesCourse1Synced = withCourse1AudioScriptOverrides(governanceChapterThreeSlidesCourse1);
const governanceClosingSlidesCourse1Synced = withCourse1AudioScriptOverrides(governanceClosingSlidesCourse1);

export const courseMeta = {
  title: 'الحوكمة والمخاطر والامتثال',
  chapter: 'الفصل الأول · الحوكمة التنظيمية والامتثال',
};

export const slides = governanceChapterOneSlides;
export const allNarratedSlides = [
  ...governanceProgramSlides,
  ...emergencyIntroSlides,
  ...emergencyChapterOneSlides,
  ...emergencyChapterTwoSlides,
  ...emergencyChapterThreeSlides,
  ...emergencyChapterFourSlides,
  ...governanceIntroSlidesCourse1Synced,
  ...governanceChapterOneSlidesCourse1Synced,
  ...governanceChapterTwoSlidesCourse1Synced,
  ...governanceChapterThreeSlidesCourse1Synced,
  ...governanceClosingSlidesCourse1Synced,
  // licensing (course/3) was missing here entirely -- meaning it never
  // showed up in docs/audio-scripts.md or any audio-doc-generation pass.
  ...licensingIntroSlides,
  ...licensingUnitOneSlides,
  ...licensingUnitTwoSlides,
  ...licensingUnitThreeSlides,
  ...licensingUnitFourSlides,
  ...licensingUnitFiveSlides,
  ...licensingClosingSlides,
  ...policyIntroSlides,
  ...policyUnitOneSlides,
  ...policyUnitTwoSlides,
  ...policyUnitThreeSlides,
  ...policyUnitFourSlides,
  ...policyUnitFiveSlides,
  ...policyClosingSlides,
  ...governance2IntroSlides,
  ...governance2UnitOneSlides,
  ...governance2UnitTwoSlides,
  ...governance2UnitThreeSlides,
  ...governance2UnitFourSlides,
  ...governance2UnitFiveSlides,
  ...governance2ClosingSlides,
  ...perfIntroSlides,
  ...perfUnitOneSlides,
  ...perfUnitTwoSlides,
  ...perfUnitThreeSlides,
  ...perfUnitFourSlides,
  ...perfUnitFiveSlides,
  ...perfClosingSlides,
  ...qualIntroSlides,
  ...qualUnitOneSlides,
  ...qualUnitTwoSlides,
  ...qualUnitThreeSlides,
  ...qualUnitFourSlides,
  ...qualUnitFiveSlides,
  ...qualClosingSlides,
];

export const courseCatalog = {
  'governance-intro': {
    meta: {
      title: 'الحوكمة والمخاطر والامتثال',
      chapter: 'مقدمة الحقيبة',
    },
    slides: governanceIntroSlides,
  },
  'governance-ch1': {
    meta: courseMeta,
    slides: governanceChapterOneSlides,
  },
  'governance-ch2': {
    meta: {
      title: 'الحوكمة والمخاطر والامتثال',
      chapter: 'الفصل الثاني · الامتثال والتدقيق والضوابط',
    },
    slides: governanceChapterTwoSlides,
  },
  'governance-ch3': {
    meta: {
      title: 'الحوكمة والمخاطر والامتثال',
      chapter: 'الفصل الثالث · إدارة المخاطر المؤسسية',
    },
    slides: governanceChapterThreeSlides,
  },
  'compliance-risk-ch1': {
    meta: {
      ...legacyCourseMeta,
      chapter: 'الحقيبة الثانية · الفصل الأول المحفوظ',
      title: `${governanceCourse.meta.title} - نسخة العمل السابقة`,
    },
    slides: legacySlides,
  },
  'emergency-intro': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'مقدمة الحقيبة',
    },
    slides: emergencyIntroSlidesLegacy,
  },
  'emergency-ch1': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'الفصل الأول · الاستعداد للطوارئ الصحية',
    },
    slides: emergencyChapterOneSlidesLegacy,
  },
  'emergency-ch2': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'الفصل الثاني · إدارة الأزمات الصحية',
    },
    slides: emergencyChapterTwoSlidesLegacy,
  },
  'emergency-ch3': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'الفصل الثالث · المسح الاستباقي والترصد المبكر',
    },
    slides: emergencyChapterThreeSlidesLegacy,
  },
  'emergency-ch4': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'الفصل الرابع · التعافي والتحسين المستمر',
    },
    slides: emergencyChapterFourSlidesLegacy,
  },
  // First two intro slides only -- used for the locked ministry-review
  // sample SCORM package (build:sample), never linked from the live site.
  'emergency-sample': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'نموذج أولي · مقدمة الحقيبة',
    },
    slides: emergencyIntroSlides.slice(0, 2),
  },
  // Client-facing teaser link (#/advcourse/2): only the bag's first 3
  // slides (the intro group), used to demo the value of digitizing a
  // training bag to prospective clients without exposing the full course.
  'emergency-demo': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'نموذج تعريفي · مقدمة الحقيبة',
    },
    slides: emergencyIntroSlides,
  },
  // The whole bag as one continuous slide sequence, for the single-link
  // #/course/2 shell (sidebar-driven navigation instead of per-chapter URLs).
  'emergency-full': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'الحقيبة كاملة',
    },
    slides: [
      ...emergencyIntroSlides,
      ...emergencyChapterOneSlides,
      ...emergencyChapterTwoSlides,
      ...emergencyChapterThreeSlides,
      ...emergencyChapterFourSlides,
    ],
  },
  // الحوكمة والمخاطر والامتثال, single-link #/course/1 shell -- reads from
  // the course1 fork above, not the shared governanceProgram.ts that
  // /bag/1/... uses, so edits here never touch bag/1.
  'governance-full': {
    meta: {
      title: 'الحوكمة والمخاطر والامتثال',
      chapter: 'الحقيبة كاملة',
    },
    slides: [
      ...governanceIntroSlidesCourse1Synced,
      ...governanceChapterOneSlidesCourse1Synced,
      ...governanceChapterTwoSlidesCourse1Synced,
      ...governanceChapterThreeSlidesCourse1Synced,
      ...governanceClosingSlidesCourse1Synced,
    ],
  },
  // ترخيص المنشآت الصحية والقوى العاملة, single-link #/course/3 shell --
  // the whole bag (intro + 5 units + closing/post-test) as one sequence.
  'licensing-full': {
    meta: {
      title: 'ترخيص المنشآت الصحية والقوى العاملة',
      chapter: 'الحقيبة كاملة',
    },
    slides: [
      ...licensingIntroSlides,
      ...licensingUnitOneSlides,
      ...licensingUnitTwoSlides,
      ...licensingUnitThreeSlides,
      ...licensingUnitFourSlides,
      ...licensingUnitFiveSlides,
      ...licensingClosingSlides,
    ],
  },
  // إعداد السياسات والأنظمة واللوائح في القطاع الصحي, single-link #/course/4
  // shell -- the whole bag (intro + 5 units + closing/post-test) as one sequence.
  'policy-full': {
    meta: {
      title: 'إعداد السياسات والأنظمة واللوائح في القطاع الصحي',
      chapter: 'الحقيبة كاملة',
    },
    slides: [
      ...policyIntroSlides,
      ...policyUnitOneSlides,
      ...policyUnitTwoSlides,
      ...policyUnitThreeSlides,
      ...policyUnitFourSlides,
      ...policyUnitFiveSlides,
      ...policyClosingSlides,
    ],
  },
  // حوكمة القطاع الصحي, single-link #/course/5 shell -- the whole bag
  // (intro + 5 units + closing/post-test) as one sequence.
  'governance2-full': {
    meta: {
      title: 'حوكمة القطاع الصحي',
      chapter: 'الحقيبة كاملة',
    },
    slides: [
      ...governance2IntroSlides,
      ...governance2UnitOneSlides,
      ...governance2UnitTwoSlides,
      ...governance2UnitThreeSlides,
      ...governance2UnitFourSlides,
      ...governance2UnitFiveSlides,
      ...governance2ClosingSlides,
    ],
  },
  // الجودة (مراقبة أداء النظام - إدارة حالات الإخفاق - والإشراف على حقوق
  // المرضى والدفاع عنهم), single-link #/course/6 shell -- the whole bag
  // (intro + 5 units + closing/post-test) as one sequence.
  'perf-full': {
    meta: {
      title: 'الجودة: مراقبة أداء النظام وإدارة حالات الإخفاق وحقوق المرضى',
      chapter: 'الحقيبة كاملة',
    },
    slides: [
      ...perfIntroSlides,
      ...perfUnitOneSlides,
      ...perfUnitTwoSlides,
      ...perfUnitThreeSlides,
      ...perfUnitFourSlides,
      ...perfUnitFiveSlides,
      ...perfClosingSlides,
    ],
  },
  // الجودة (معايير - فحص - مراقبة وتحسين الجودة), single-link #/course/7
  // shell -- the whole bag (intro + 5 units + closing/post-test) as one sequence.
  'qual-full': {
    meta: {
      title: 'الجودة: معايير وفحص ومراقبة وتحسين الجودة',
      chapter: 'الحقيبة كاملة',
    },
    slides: [
      ...qualIntroSlides,
      ...qualUnitOneSlides,
      ...qualUnitTwoSlides,
      ...qualUnitThreeSlides,
      ...qualUnitFourSlides,
      ...qualUnitFiveSlides,
      ...qualClosingSlides,
    ],
  },
};

export type CourseId = keyof typeof courseCatalog;

export function getSlidesForCourse(courseId: string) {
  return courseCatalog[courseId as CourseId]?.slides ?? governanceIntroSlides;
}

export function getCourseMeta(courseId: string) {
  return courseCatalog[courseId as CourseId]?.meta ?? courseCatalog['governance-intro'].meta;
}
