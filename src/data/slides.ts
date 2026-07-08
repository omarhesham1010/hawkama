import { course as governanceCourse } from './courseContent';
import {
  governanceChapterOneSlides,
  governanceChapterThreeSlides,
  governanceChapterTwoSlides,
  governanceIntroSlides,
  governanceProgramSlides,
} from './governanceProgram';
import { courseMeta as legacyCourseMeta, slides as legacySlides } from './legacySlides';

export const courseMeta = {
  title: 'الحوكمة والمخاطر والامتثال',
  chapter: 'الفصل الأول · الحوكمة التنظيمية والامتثال',
};

export const slides = governanceChapterOneSlides;
export const allNarratedSlides = governanceProgramSlides;

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
};

export type CourseId = keyof typeof courseCatalog;

export function getSlidesForCourse(courseId: string) {
  return courseCatalog[courseId as CourseId]?.slides ?? governanceIntroSlides;
}

export function getCourseMeta(courseId: string) {
  return courseCatalog[courseId as CourseId]?.meta ?? courseCatalog['governance-intro'].meta;
}
