import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { NarrationSettings } from '../audio/NarrationSettings';
import { toArabicDigits } from '../../lib/utils';

function HeaderBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white transition-colors hover:bg-white/30"
    >
      {children}
    </button>
  );
}

export function PlayerHeader({
  courseTitle,
  slideTitle,
  sectionLabel,
  index,
  total,
  onExit,
  onOpenMenu,
  onOpenHelp,
}: {
  courseTitle: string;
  slideTitle: string;
  sectionLabel: string;
  index: number;
  total: number;
  onExit: () => void;
  onOpenMenu: () => void;
  onOpenHelp: () => void;
}) {
  const [showVoice, setShowVoice] = useState(false);

  return (
    <header className="relative z-30 bg-gradient-to-l from-green-800 via-green-600 to-teal-600 shadow-card-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        {/* logo / org */}
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-green-700">
            <Icon name="shield" className="w-5 h-5" />
          </span>
          <span className="hidden text-[13px] font-bold text-white sm:block">أكاديمية الحوكمة</span>
        </div>

        {/* title pill */}
        <div className="mx-auto min-w-0 flex-1 max-w-2xl">
          <div className="truncate rounded-full bg-white px-6 py-2 text-center text-[15px] font-bold text-brand-strong shadow-card">
            {slideTitle}
          </div>
        </div>

        {/* controls */}
        <div className="relative flex items-center gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-brand-strong shadow-card tabular">
            {toArabicDigits(index + 1)} / {toArabicDigits(total)}
          </span>
          <HeaderBtn onClick={onExit} label="العودة إلى المنصة">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11l9-8 9 8" />
              <path d="M5 10v10h14V10" />
              <path d="M10 20v-6h4v6" />
            </svg>
          </HeaderBtn>
          <HeaderBtn onClick={() => setShowVoice((v) => !v)} label="خيارات الصوت">
            <Icon name="sound" className="w-5 h-5" />
          </HeaderBtn>
          <HeaderBtn onClick={onOpenHelp} label="المساعدة">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .8-1.5 1.3-1.5 2.5" />
              <circle cx="12" cy="17" r="0.6" fill="currentColor" />
            </svg>
          </HeaderBtn>
          <HeaderBtn onClick={onOpenMenu} label="قائمة الشرائح">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </HeaderBtn>

          {showVoice && (
            <div className="absolute left-0 top-11 z-40 w-72 text-ink">
              <NarrationSettings onClose={() => setShowVoice(false)} />
            </div>
          )}
        </div>
      </div>

      {/* section label pill (like the client's "الأهداف" tab) */}
      <div className="flex justify-center">
        <span className="-mt-px rounded-b-xl bg-teal-800/85 px-8 py-1 text-[13px] font-semibold text-white shadow-card">
          {sectionLabel}
        </span>
      </div>

      <span className="sr-only">{courseTitle}</span>
    </header>
  );
}
