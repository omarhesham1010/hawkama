export const course11IntroCues: Readonly<Record<string, readonly string[]>> = {
  'ce11-welcome': [
    'الأساس التنظيمي والأخلاقي للالتزام',
    'التفتيش القائم على المخاطر',
    'الفحص والتدقيق ومراقبة الامتثال',
    'الإنفاذ والتعامل مع القضايا',
    'التقارير الرقابية',
  ],
  'ce11-u1-welcome': [
    'دور الالتزام في النظام الصحي',
    'أخلاقيات الرقابة والإنفاذ',
    'سلوكيات الخاضعين للرقابة',
    'أسس استقبال الشكاوى وتصنيف الأخطاء الطبية',
  ],
  'ce11-u2-welcome': [
    'التحليل وتقييم المخاطر',
    'تصنيف المنشآت وإدارة المخاطر المؤسسية',
    'تصميم بروتوكولات التفتيش',
    'أساليب جمع العينات ومعايير التدقيق',
  ],
  'ce11-u3-welcome': [
    'الفحص والتدقيق التنظيمي',
    'اختبارات الضوابط الداخلية',
    'مؤشرات الإنذار المبكر',
    'مؤشرات الأداء للرقابة والتفتيش',
  ],
  'ce11-u4-welcome': [
    'متى ننتقل من الرقابة إلى الإنفاذ',
    'جمع الأدلة وتوثيقها',
    'أعمال أمانة السر وتوثيق محاضر اللجان',
    'اتخاذ القرار المبني على الأدلة',
  ],
  'ce11-u5-welcome': [
    'عناصر التقرير الرقابي الفعال',
    'إعداد وإدارة التقارير التنظيمية',
    'صياغة وتطوير السياسات الصحية',
    'إدارة أصحاب المصلحة',
  ],
};

function normalizeSpeechCue(text: string) {
  return text
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Finds a visible cue in the narration while preserving its source-text
 * character index. The normalized fallback tolerates Arabic hamza,
 * taa-marbuta, alef-maqsura, and diacritic differences. */
export function narrationCuePosition(narration: string, needle: string, after = 0) {
  const directIndex = needle ? narration.indexOf(needle, Math.max(0, after)) : -1;
  if (directIndex >= 0) return directIndex;

  const normalizedNarration = normalizeSpeechCue(narration);
  const normalizedNeedle = normalizeSpeechCue(needle);
  const sourceToNormalizedRatio = narration.length / Math.max(1, normalizedNarration.length);
  const normalizedStart = Math.max(0, Math.floor(after / Math.max(0.001, sourceToNormalizedRatio)));
  const normalizedIndex = normalizedNeedle ? normalizedNarration.indexOf(normalizedNeedle, normalizedStart) : -1;
  return normalizedIndex >= 0 ? Math.floor(normalizedIndex * sourceToNormalizedRatio) : -1;
}
