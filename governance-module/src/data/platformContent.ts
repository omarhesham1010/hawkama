import type { IconKey } from '../types/course';

// ============================================================
//  بنية المنصة التعليمية (الكتالوج).
//  عناوين الحقائب والفصول هنا هي عناصر كتالوج تنظيمية (Placeholders)
//  وليست محتوى تعليمياً. الفصل الوحيد الجاهز والقابل للدخول هو:
//  الحقيبة الأولى ← الفصل الأول (courseId: 'governance-ch1')
//  وهو الوحدة الكاملة التي بنيناها من العرض التقديمي.
//  بقية الفصول موسومة «قريباً».
// ============================================================

export type ChapterStatus = 'ready' | 'soon';
export type TrackStatus = 'available' | 'soon';

export interface PlatformChapter {
  index: number;
  title: string;
  status: ChapterStatus;
  courseId?: string; // set only for the ready chapter
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

/** Generic "coming soon" chapters for tracks that aren't published yet. */
function soonChapters(prefix: string): PlatformChapter[] {
  return Array.from({ length: 10 }, (_, i) => ({
    index: i + 1,
    title: `${prefix} — الفصل ${i + 1}`,
    status: 'soon' as const,
  }));
}

// Track 1 — the published track. Chapter 1 is our real module.
const track1Chapters: PlatformChapter[] = [
  { index: 1, title: 'نماذج وهياكل الحوكمة الصحية', status: 'ready', courseId: 'governance-ch1' },
  { index: 2, title: 'أطر الحوكمة ولوائح الصلاحيات', status: 'soon' },
  { index: 3, title: 'مجلس الإدارة واللجان المتخصصة', status: 'soon' },
  { index: 4, title: 'المساءلة والشفافية المؤسسية', status: 'soon' },
  { index: 5, title: 'حوكمة البيانات الصحية', status: 'soon' },
  { index: 6, title: 'حوكمة المخاطر المؤسسية', status: 'soon' },
  { index: 7, title: 'حوكمة الجودة وسلامة المرضى', status: 'soon' },
  { index: 8, title: 'التقارير ومؤشرات الأداء', status: 'soon' },
  { index: 9, title: 'حوكمة العقود والمشتريات', status: 'soon' },
  { index: 10, title: 'مراجعة وتقييم منظومة الحوكمة', status: 'soon' },
];

export const platform: {
  name: string;
  tagline: string;
  intro: string;
  tracks: Track[];
} = {
  name: 'أكاديمية الحوكمة والامتثال',
  tagline: 'منصة تدريب احترافية للقطاع الصحي والمؤسسي',
  intro:
    'عشر حقائب تدريبية متكاملة، تضم مئة فصل تفاعلي، تنقلك خطوة بخطوة في عالم الحوكمة والامتثال والجودة والنزاهة المؤسسية — بأنشطة وألعاب تدريبية وشرح صوتي وشهادات إتمام.',
  tracks: [
    {
      id: 'governance',
      index: 1,
      title: 'الحوكمة الصحية',
      short: 'نماذج الحوكمة وهياكلها وعلاقتها بالامتثال والأخلاقيات',
      icon: 'shield',
      status: 'available',
      chapters: track1Chapters,
    },
    {
      id: 'compliance-risk',
      index: 2,
      title: 'الامتثال وإدارة المخاطر',
      short: 'بناء برامج الامتثال وضبط المخاطر التنظيمية',
      icon: 'scale',
      status: 'soon',
      chapters: soonChapters('الامتثال وإدارة المخاطر'),
    },
    {
      id: 'ethics',
      index: 3,
      title: 'أخلاقيات المهنة والنزاهة',
      short: 'القيم المهنية وتضارب المصالح والنزاهة المؤسسية',
      icon: 'integrity',
      status: 'soon',
      chapters: soonChapters('أخلاقيات المهنة'),
    },
    {
      id: 'quality',
      index: 4,
      title: 'الجودة وسلامة المرضى',
      short: 'أنظمة الجودة ومؤشرات سلامة المرضى والتحسين المستمر',
      icon: 'clipboard',
      status: 'soon',
      chapters: soonChapters('الجودة وسلامة المرضى'),
    },
    {
      id: 'leadership',
      index: 5,
      title: 'القيادة والحوكمة المؤسسية',
      short: 'مهارات القيادة الإدارية والحوكمة الرشيدة',
      icon: 'building',
      status: 'soon',
      chapters: soonChapters('القيادة المؤسسية'),
    },
    {
      id: 'hr',
      index: 6,
      title: 'إدارة الموارد البشرية الصحية',
      short: 'إدارة الكفاءات والأداء في المؤسسات الصحية',
      icon: 'committee',
      status: 'soon',
      chapters: soonChapters('الموارد البشرية'),
    },
    {
      id: 'data-security',
      index: 7,
      title: 'أمن المعلومات وحماية البيانات',
      short: 'حماية البيانات الصحية والخصوصية والأمن السيبراني',
      icon: 'eye',
      status: 'soon',
      chapters: soonChapters('أمن المعلومات'),
    },
    {
      id: 'digital',
      index: 8,
      title: 'التحول الرقمي الصحي',
      short: 'رقمنة الخدمات والحوكمة الرقمية في الرعاية الصحية',
      icon: 'matrix',
      status: 'soon',
      chapters: soonChapters('التحول الرقمي'),
    },
    {
      id: 'strategy',
      index: 9,
      title: 'التخطيط الاستراتيجي والأداء',
      short: 'بناء الاستراتيجية وقياس الأداء المؤسسي',
      icon: 'compass',
      status: 'soon',
      chapters: soonChapters('التخطيط الاستراتيجي'),
    },
    {
      id: 'accreditation',
      index: 10,
      title: 'الاعتماد والمعايير الدولية',
      short: 'متطلبات الاعتماد والمواءمة مع المعايير العالمية',
      icon: 'flag',
      status: 'soon',
      chapters: soonChapters('الاعتماد والمعايير'),
    },
  ],
};
