import type { WelcomeSection } from '../../types/course';
import { Icon } from '../ui/Icon';
import { Chip } from '../ui/Chip';
import { AudioNarrationButton } from '../audio/AudioNarrationButton';
import { HeroArt } from './HeroArt';

export function WelcomeScreen({
  section,
  onStart,
  onResume,
  hasProgress,
}: {
  section: WelcomeSection;
  onStart: () => void;
  onResume: () => void;
  hasProgress: boolean;
}) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2">
      <div className="animate-fade-up">
        <span className="chip mb-4 bg-gold-500/15 text-gold-600 dark:text-gold-300 text-sm font-bold">
          <Icon name="sparkles" className="w-4 h-4" />
          {section.eyebrow}
        </span>
        <h1 className="text-2xl font-extrabold leading-tight text-brand-strong sm:text-3xl lg:text-4xl">
          {section.title}
        </h1>
        <p className="mt-3 text-base font-semibold text-brand">{section.subtitle}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{section.intro}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Chip tone="gold">
            <Icon name="target" className="w-4 h-4" />
            المدة التقديرية: {section.duration}
          </Chip>
          {section.highlights.map((h) => (
            <Chip key={h.label} tone="neutral">
              <Icon name={h.icon} className="w-4 h-4 text-brand" />
              {h.label}
            </Chip>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button type="button" onClick={onStart} className="btn-primary px-7 py-3.5 text-base">
            <Icon name="flag" className="w-5 h-5" />
            ابدأ الوحدة
          </button>
          {hasProgress && (
            <button type="button" onClick={onResume} className="btn-ghost px-6 py-3.5 text-base">
              <Icon name="flow" className="w-5 h-5" />
              متابعة من حيث توقفت
            </button>
          )}
        </div>

        <div className="mt-6 max-w-md">
          <AudioNarrationButton
            narrationKey={section.narrationKey}
            script={section.narration}
            label={section.navLabel}
          />
        </div>
      </div>

      <div className="order-first lg:order-last">
        <div className="card p-6 sm:p-8">
          <HeroArt className="mx-auto w-full max-w-[440px]" />
        </div>
      </div>
    </div>
  );
}
