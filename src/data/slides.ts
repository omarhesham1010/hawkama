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
import { courseMeta as legacyCourseMeta, slides as legacySlides } from './legacySlides';

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
  ...governanceIntroSlidesCourse1,
  ...governanceChapterOneSlidesCourse1,
  ...governanceChapterTwoSlidesCourse1,
  ...governanceChapterThreeSlidesCourse1,
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
      ...governanceIntroSlidesCourse1,
      ...governanceChapterOneSlidesCourse1,
      ...governanceChapterTwoSlidesCourse1,
      ...governanceChapterThreeSlidesCourse1,
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
};

export type CourseId = keyof typeof courseCatalog;

export function getSlidesForCourse(courseId: string) {
  return courseCatalog[courseId as CourseId]?.slides ?? governanceIntroSlides;
}

export function getCourseMeta(courseId: string) {
  return courseCatalog[courseId as CourseId]?.meta ?? courseCatalog['governance-intro'].meta;
}
