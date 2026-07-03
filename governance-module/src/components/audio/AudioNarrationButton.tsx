import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { useNarrationContext } from './NarrationContext';
import { NarrationSettings } from './NarrationSettings';

/** Animated equalizer shown while narration is playing. */
function Equalizer() {
  return (
    <span className="flex items-end gap-[3px] h-4" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="sound-bar w-[3px] h-full rounded-full bg-current" />
      ))}
    </span>
  );
}

/**
 * The per-section narration control.
 * Plays /audio/<narrationKey>.mp3 if present, else Arabic Web Speech TTS.
 */
export function AudioNarrationButton({
  narrationKey,
  script,
  label,
}: {
  narrationKey: string;
  script: string;
  label: string;
}) {
  const { play, stop, replay, isPlaying, isLoading, source, nowKey, ttsSupported } =
    useNarrationContext();
  const [showScript, setShowScript] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isThis = nowKey === narrationKey;
  const activeHere = isThis && (isPlaying || isLoading);

  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {!activeHere ? (
          <button
            type="button"
            onClick={() => play(narrationKey, script, label)}
            className="btn-primary px-4 py-2.5 text-sm"
          >
            <Icon name="sound" className="w-5 h-5" />
            تشغيل الشرح الصوتي
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="btn bg-brand text-white px-4 py-2.5 text-sm shadow-card"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <Equalizer />
            )}
            إيقاف الشرح
          </button>
        )}

        <button
          type="button"
          onClick={() => (isThis ? replay() : play(narrationKey, script, label))}
          className="btn-ghost px-3 py-2.5 text-sm"
          title="إعادة التشغيل"
        >
          <Icon name="flow" className="w-4 h-4" />
          إعادة
        </button>

        <button
          type="button"
          onClick={() => setShowScript((v) => !v)}
          className="btn-ghost px-3 py-2.5 text-sm"
          aria-expanded={showScript}
        >
          <Icon name="doc" className="w-4 h-4" />
          نص الشرح
        </button>

        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="btn-ghost px-3 py-2.5 text-sm"
          aria-expanded={showSettings}
          title="خيارات الصوت"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.2.62.77 1.05 1.42 1.09" />
          </svg>
          الصوت
        </button>

        {activeHere && (
          <span className="chip bg-brand/12 text-brand text-xs">
            {source === 'audio' ? 'يعمل: ملف صوتي' : 'يعمل: قراءة آلية'}
          </span>
        )}
      </div>

      {showSettings && <NarrationSettings onClose={() => setShowSettings(false)} />}

      {showScript && (
        <div className="mt-3 rounded-xl bg-surface p-4 text-sm leading-loose text-ink-soft animate-fade-in border border-line">
          <p className="mb-2 flex items-center gap-2 font-semibold text-ink">
            <Icon name="doc" className="w-4 h-4 text-brand" />
            نص الشرح الصوتي
          </p>
          {script}
          {!ttsSupported && (
            <p className="mt-3 text-xs text-gold-600 dark:text-gold-400">
              متصفحك لا يدعم القراءة الصوتية الآلية — أضِف ملف صوت في مجلد /public/audio لتشغيل
              الشرح.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
