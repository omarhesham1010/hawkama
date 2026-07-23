import { useState } from 'react';
import { SlideCanvas } from '../player/SlideCanvas';
import type { LearnerGender, LearnerProfile } from '../../hooks/useLearnerProfile';

const AVATAR_SRC: Record<LearnerGender, string> = {
  male: '/avatar-assets/avatar-male.png',
  female: '/avatar-assets/avatar-female.png',
};

function AvatarOption({
  gender,
  label,
  selected,
  onSelect,
}: {
  gender: LearnerGender;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col items-center gap-3 outline-none"
    >
      <span
        className={`grid h-[132px] w-[132px] shrink-0 place-items-center overflow-hidden rounded-full bg-gold-100 shadow-card transition-all duration-300 ${
          selected
            ? 'scale-[1.06] shadow-[0_16px_30px_rgb(31_105_72_/_0.22)] ring-4 ring-green-600/30'
            : 'ring-1 ring-green-700/12 group-hover:scale-[1.03] group-hover:ring-green-600/25'
        }`}
      >
        <img src={AVATAR_SRC[gender]} alt={label} className="h-full w-full object-cover" draggable={false} />
      </span>
      <span className={`text-[15px] font-extrabold ${selected ? 'text-brand-strong' : 'text-ink-soft'}`}>{label}</span>
    </button>
  );
}

export function PersonalizationGate({ onDone }: { onDone: (profile: LearnerProfile) => void }) {
  const [gender, setGender] = useState<LearnerGender | null>(null);
  const [name, setName] = useState('');

  const canContinue = Boolean(gender) && name.trim().length >= 2;

  const submit = () => {
    if (!gender || !canContinue) return;
    onDone({ gender, name: name.trim() });
  };

  return (
    <div dir="rtl" className="grid h-screen w-screen place-items-center bg-canvas p-2">
      <SlideCanvas>
        <div className="relative z-10 flex h-full min-h-0 flex-col items-center justify-center gap-7 px-10 py-10">
          <div className="flex items-center gap-10">
            <AvatarOption gender="male" label="ذكر" selected={gender === 'male'} onSelect={() => setGender('male')} />
            <AvatarOption gender="female" label="أنثى" selected={gender === 'female'} onSelect={() => setGender('female')} />
          </div>

          <div className="w-full max-w-[420px]">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="اكتب اسمك هنا"
              dir="rtl"
              className="w-full rounded-2xl border border-green-700/15 bg-gold-100 px-5 py-4 text-center text-[17px] font-bold text-brand-strong placeholder:text-ink-muted shadow-inner outline-none transition-colors focus:border-green-600/50 focus:bg-white"
            />
          </div>

          <p className="max-w-[460px] text-center text-[15px] font-bold leading-relaxed text-ink-soft">
            حدد الشخصية التي تمثلك واكتب اسمك ثم اضغط على "التالي"
          </p>

          <div className="mt-2 flex items-center gap-4">
            <button
              type="button"
              disabled
              className="flex items-center gap-2 rounded-full border border-green-700/15 bg-white/70 px-6 py-2.5 text-[15px] font-extrabold text-ink-muted opacity-50"
            >
              السابق
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canContinue}
              className={`flex items-center gap-2 rounded-full border px-7 py-2.5 text-[15px] font-extrabold transition-all ${
                canContinue
                  ? 'border-green-700 bg-green-700 text-white shadow-card hover:bg-green-800'
                  : 'border-green-700/15 bg-white/70 text-ink-muted opacity-50'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
              التالي
            </button>
          </div>
        </div>
      </SlideCanvas>
    </div>
  );
}
