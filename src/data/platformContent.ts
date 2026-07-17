import type { IconKey } from '../types/course';

export type ChapterStatus = 'ready' | 'soon';
export type TrackStatus = 'available' | 'soon';

export interface PlatformChapter {
  index: number;
  label: string;
  title: string;
  status: ChapterStatus;
  courseId?: string;
}

export interface Track {
  id: string;
  title: string;
  short: string;
  icon: IconKey;
  status: TrackStatus;
  chapters: PlatformChapter[];
}

const governanceChapters: PlatformChapter[] = [
  {
    index: 1,
    label: 'المقدمة',
    title: 'مقدمة الحقيبة ومحاور البرنامج',
    status: 'ready',
    courseId: 'governance-intro',
  },
  {
    index: 2,
    label: 'الفصل الأول',
    title: 'الحوكمة التنظيمية والامتثال',
    status: 'ready',
    courseId: 'governance-ch1',
  },
  {
    index: 3,
    label: 'الفصل الثاني',
    title: 'الامتثال والتدقيق والضوابط',
    status: 'ready',
    courseId: 'governance-ch2',
  },
  {
    index: 4,
    label: 'الفصل الثالث',
    title: 'إدارة المخاطر المؤسسية',
    status: 'ready',
    courseId: 'governance-ch3',
  },
];

const emergencyChapters: PlatformChapter[] = [
  {
    index: 1,
    label: 'المقدمة',
    title: 'مقدمة الحقيبة ومحاور البرنامج',
    status: 'ready',
    courseId: 'emergency-intro',
  },
  {
    index: 2,
    label: 'الفصل الأول',
    title: 'الاستعداد للطوارئ الصحية',
    status: 'ready',
    courseId: 'emergency-ch1',
  },
  {
    index: 3,
    label: 'الفصل الثاني',
    title: 'إدارة الأزمات الصحية',
    status: 'ready',
    courseId: 'emergency-ch2',
  },
  {
    index: 4,
    label: 'الفصل الثالث',
    title: 'المسح الاستباقي والترصد المبكر',
    status: 'ready',
    courseId: 'emergency-ch3',
  },
  {
    index: 5,
    label: 'الفصل الرابع',
    title: 'التعافي والتحسين المستمر',
    status: 'ready',
    courseId: 'emergency-ch4',
  },
];

export const platform: {
  tagline: string;
  intro: string;
  tracks: Track[];
} = {
  tagline: 'منصة تدريب احترافية للقطاع الصحي والمؤسسي',
  intro:
    'حقيبتان تدريبيتان متاحتان الآن بكل فصولهما، ضمن تجربة تعلم إلكتروني تفاعلية، ويُضاف محتوى حقائب جديدة بعد اعتمادها.',
  tracks: [
    {
      id: 'governance',
      title: 'الحوكمة والمخاطر والامتثال',
      short: 'الحوكمة التنظيمية، الامتثال والتدقيق والضوابط، وإدارة المخاطر المؤسسية.',
      icon: 'shield',
      status: 'available',
      chapters: governanceChapters,
    },
    {
      id: 'emergency-response',
      title: 'إدارة الاستجابة للطوارئ',
      short: 'الاستعداد للطوارئ، إدارة الأزمات واتخاذ القرار، المسح الاستباقي، والتعافي والتحسين المستمر.',
      icon: 'alert',
      status: 'available',
      chapters: emergencyChapters,
    },
  ],
};
