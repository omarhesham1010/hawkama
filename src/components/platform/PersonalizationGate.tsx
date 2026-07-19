import { useState } from 'react';
import { SlideCanvas } from '../player/SlideCanvas';
import type { LearnerGender, LearnerProfile } from '../../hooks/useLearnerProfile';

function MaleAvatarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill={active ? '#EAF3EC' : '#F4F1E9'} stroke="#1F6948" strokeWidth={active ? 3 : 2} />
      {/* ghutra / headdress */}
      <path d="M28 34c0-12 9-20 22-20s22 8 22 20l3 10-6-3 1 7-6-4-2 6-4-5-4 6-4-6-4 5-2-6-6 4 1-7-6 3z" fill="none" stroke="#1F6948" strokeWidth="2.4" strokeLinejoin="round" />
      {/* face */}
      <path d="M36 40c0-9 6-15 14-15s14 6 14 15c0 10-6 20-14 20s-14-10-14-20z" fill="none" stroke="#1F6948" strokeWidth="2.4" />
      {/* beard */}
      <path d="M37 46c0 10 5 18 13 18s13-8 13-18" fill="none" stroke="#1F6948" strokeWidth="2.2" />
      {/* shoulders / thobe */}
      <path d="M24 88c2-14 12-22 26-22s24 8 26 22" fill="none" stroke="#1F6948" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function FemaleAvatarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill={active ? '#EAF3EC' : '#F4F1E9'} stroke="#1F6948" strokeWidth={active ? 3 : 2} />
      {/* hijab */}
      <path d="M27 46c0-14 10-25 23-25s23 11 23 25c0 4-1 7-2 10l-6-5 1 8-6-5-1 6-5-6-4 6-5-6-1 6-6-5 1-8-6 5c-1-3-2-6-2-10z" fill="none" stroke="#1F6948" strokeWidth="2.4" strokeLinejoin="round" />
      {/* face */}
      <path d="M37 42c0-8 6-13 13-13s13 5 13 13c0 9-6 18-13 18s-13-9-13-18z" fill="none" stroke="#1F6948" strokeWidth="2.4" />
      {/* shoulders / abaya */}
      <path d="M22 88c2-15 13-24 28-24s26 9 28 24" fill="none" stroke="#1F6948" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

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
        className={`grid h-[132px] w-[132px] shrink-0 place-items-center rounded-full p-3 shadow-card transition-all duration-300 ${
          selected
            ? 'scale-[1.06] shadow-[0_16px_30px_rgb(31_105_72_/_0.22)] ring-4 ring-green-600/30'
            : 'ring-1 ring-green-700/12 group-hover:scale-[1.03] group-hover:ring-green-600/25'
        }`}
      >
        {gender === 'male' ? <MaleAvatarIcon active={selected} /> : <FemaleAvatarIcon active={selected} />}
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
    <div dir="rtl" className="grid h-screen w-screen place-items-center bg-[#f7fbf8] p-2">
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
              className="w-full rounded-2xl border border-green-700/15 bg-[#F4F1E9] px-5 py-4 text-center text-[17px] font-bold text-brand-strong placeholder:text-ink-muted shadow-inner outline-none transition-colors focus:border-green-600/50 focus:bg-white"
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
