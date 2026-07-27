import { useEffect } from 'react';

const items: { icon: React.ReactNode; label: string }[] = [
  {
    label: 'قائمة الشرائح — التنقل بين صفحات المقرر',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
  },
  {
    label: 'الصفحة الرئيسية — العودة إلى المنصة',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    label: 'التالي / السابق — الانتقال بين الشرائح',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 6l-6 6 6 6M9 6" />
      </svg>
    ),
  },
  {
    label: 'تشغيل / إيقاف الشرح الصوتي',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
  },
  {
    label: 'إعادة الشريحة من البداية',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 3v4h4" />
      </svg>
    ),
  },
  {
    label: 'التحكم في الصوت (كتم / تشغيل)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9v6h4l5 4V5L8 9z" />
        <path d="M16 9a4 4 0 010 6" />
      </svg>
    ),
  },
  {
    label: 'خيارات الصوت — اختيار الصوت والسرعة',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      </svg>
    ),
  },
  {
    label: 'شريط التقدّم — يتابع تقدّم الشرح الصوتي',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="10" width="18" height="4" rx="2" />
        <circle cx="9" cy="12" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-greenLegacy-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-line bg-surface shadow-card-lg animate-scale-in">
        <div className="flex items-center justify-between bg-gradient-to-l from-greenLegacy-800 via-greenLegacy-600 to-tealLegacy-600 px-6 py-4 text-white">
          <p className="text-lg font-bold">دليل استخدام المشغّل</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 hover:bg-white/30"
            aria-label="إغلاق"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-6">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border-2 border-greenLegacy-400/50 bg-surface p-3.5 shadow-card">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-greenLegacy-500/15 text-greenLegacy-700">
                {it.icon}
              </span>
              <p className="text-[15px] font-semibold text-ink">{it.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
