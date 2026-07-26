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
    slides: emergencyIntroSlides,
  },
  'emergency-ch1': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'الفصل الأول · الاستعداد للطوارئ الصحية',
    },
    slides: emergencyChapterOneSlides,
  },
  'emergency-ch2': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'الفصل الثاني · إدارة الأزمات الصحية',
    },
    slides: emergencyChapterTwoSlides,
  },
  'emergency-ch3': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'الفصل الثالث · المسح الاستباقي والترصد المبكر',
    },
    slides: emergencyChapterThreeSlides,
  },
  'emergency-ch4': {
    meta: {
      title: 'إدارة الاستجابة للطوارئ',
      chapter: 'الفصل الرابع · التعافي والتحسين المستمر',
    },
    slides: emergencyChapterFourSlides,
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
