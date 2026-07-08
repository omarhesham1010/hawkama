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
  index: number;
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

const genericIcons: IconKey[] = [
  'scale',
  'integrity',
  'clipboard',
  'building',
  'committee',
  'eye',
  'matrix',
  'compass',
  'flag',
];

const comingTracks: Track[] = Array.from({ length: 9 }, (_, offset) => {
  const index = offset + 2;
  return {
    id: `bag-${index}`,
    index,
    title: `الحقيبة ${['الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة', 'الثامنة', 'التاسعة', 'العاشرة'][offset]}`,
    short: 'سيُضاف اسم الحقيبة ومحتواها بعد استلام المادة التدريبية المعتمدة.',
    icon: genericIcons[offset],
    status: 'soon' as const,
    chapters: [],
  };
});

export const platform: {
  name: string;
  tagline: string;
  intro: string;
  tracks: Track[];
} = {
  name: 'أكاديمية الحوكمة والامتثال',
  tagline: 'منصة تدريب احترافية للقطاع الصحي والمؤسسي',
  intro:
    'عشر حقائب تدريبية ضمن تجربة تعلم إلكتروني تفاعلية. الحقيبة الأولى متاحة الآن بمقدمتها وفصولها الثلاثة، ويُضاف محتوى بقية الحقائب بعد اعتماده.',
  tracks: [
    {
      id: 'governance',
      index: 1,
      title: 'الحوكمة والمخاطر والامتثال',
      short: 'الحوكمة التنظيمية، الامتثال والتدقيق والضوابط، وإدارة المخاطر المؤسسية.',
      icon: 'shield',
      status: 'available',
      chapters: governanceChapters,
    },
    ...comingTracks,
  ],
};
