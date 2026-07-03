import { Icon } from '../ui/Icon';
import { useNarrationContext } from './NarrationContext';

const speeds = [
  { label: 'بطيء', value: 0.85 },
  { label: 'عادي', value: 1 },
  { label: 'سريع', value: 1.2 },
  { label: 'أسرع', value: 1.4 },
];

/** Voice + speed options for the narration (applies to the TTS fallback). */
export function NarrationSettings({ onClose }: { onClose: () => void }) {
  const { voices, voiceURI, setVoiceURI, rate, setRate } = useNarrationContext();

  return (
    <div className="mt-3 rounded-xl border border-line bg-surface p-4 text-sm animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 font-bold text-ink">
          <Icon name="sound" className="w-4 h-4 text-brand" />
          خيارات الشرح الصوتي
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-ink-muted hover:text-brand"
          aria-label="إغلاق"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Voice picker */}
      <label className="mb-1.5 block text-xs font-semibold text-ink-soft">الصوت</label>
      {voices.length > 0 ? (
        <select
          value={voiceURI ?? ''}
          onChange={(e) => setVoiceURI(e.target.value || null)}
          className="mb-4 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-ink focus:border-brand focus:outline-none"
        >
          <option value="">الصوت العربي الافتراضي</option>
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} — {v.lang}
            </option>
          ))}
        </select>
      ) : (
        <p className="mb-4 rounded-lg bg-gold-500/10 px-3 py-2 text-xs text-gold-600 dark:text-gold-300">
          لا توجد أصوات عربية مثبّتة في المتصفح حالياً. يمكنك إضافة ملفات صوت احترافية في مجلد
          /public/audio لتشغيلها بدل القراءة الآلية.
        </p>
      )}

      {/* Speed */}
      <label className="mb-1.5 block text-xs font-semibold text-ink-soft">السرعة</label>
      <div className="grid grid-cols-4 gap-1.5">
        {speeds.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setRate(s.value)}
            className={`rounded-lg border-2 px-2 py-2 text-xs font-bold transition-colors ${
              rate === s.value
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-line bg-surface-2 text-ink-soft hover:border-brand/40'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
