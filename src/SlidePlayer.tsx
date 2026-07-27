import { useCallback, useEffect, useRef, useState } from 'react';
import { useSlidePlayerEngine } from './hooks/useSlidePlayerEngine';
import { toArabicDigits } from './lib/utils';

import { BackgroundDecor } from './components/course/BackgroundDecor';
import { PlayerHeader } from './components/player/PlayerHeader';
import { SlideMenu } from './components/player/SlideMenu';
import { SlideStage } from './components/player/SlideStage';
import { SlideCanvas } from './components/player/SlideCanvas';
import { HelpOverlay } from './components/player/HelpOverlay';
import { Icon } from './components/ui/Icon';
// The client asked for /bag/2/... (the emergency-response bag's legacy
// per-chapter route) to keep rendering exactly as it did before course/2
// work began, while course/2 and course/3 keep the current styling --
// those two shells never render through SlidePlayer, only this legacy
// route does. See src/legacy-bag2/README (colocated notes in each file)
// and the ".legacy-bag2-scope" CSS block in src/styles/index.css.
import { PlayerHeader as PlayerHeaderLegacy } from './legacy-bag2/components/player/PlayerHeader';
import { SlideMenu as SlideMenuLegacy } from './legacy-bag2/components/player/SlideMenu';
import { SlideStage as SlideStageLegacy } from './legacy-bag2/components/player/SlideStage';
import { HelpOverlay as HelpOverlayLegacy } from './legacy-bag2/components/player/HelpOverlay';
import { Icon as IconLegacy } from './legacy-bag2/components/ui/Icon';

const SECTION_LABEL: Record<string, string> = {
  welcome: 'مقدمة الوحدة',
  content: 'شرح مصوّر',
  activity: 'نشاط تدريبي',
  quiz: 'اختبار المعرفة',
  reflection: 'وقفة تأمّل',
  completion: 'إتمام الوحدة',
};

/** Articulate-Storyline-style narrated slide player (voice-synced reveal). */
export default function SlidePlayer({
  courseId = 'governance-intro',
  initialSlide = 1,
  onExit,
  syncUrl = true,
  onSlideChange,
}: {
  courseId?: string;
  initialSlide?: number;
  onExit: () => void;
  /** Set to false when embedding this player inside a shell that owns its
   *  own URL (e.g. the single-link course-2 sidebar shell) so this player
   *  doesn't rewrite the address bar to its own #/bag/... hash. */
  syncUrl?: boolean;
  /** Fires whenever the current slide index changes, for a host shell that
   *  wants to mirror the current position (e.g. to highlight it in an
   *  external sidebar) without owning the index itself. */
  onSlideChange?: (index: number) => void;
}) {
  const {
    slides,
    slide,
    courseMeta,
    progress,
    narration,
    index,
    started,
    muted,
    replayNonce,
    sync,
    showDialogue,
    voicePlaying,
    totalActivities,
    displaySlideTitle,
    goTo,
    start,
    handlePlayPause,
    handleReplay,
    toggleMute,
    restartCourse,
    exit,
  } = useSlidePlayerEngine({ courseId, initialSlide, onExit, syncUrl, onSlideChange });

  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // See the legacy-bag2 imports above -- only this route (courseId starting
  // with "emergency", i.e. /bag/2/...) uses the pre-course/2 rendering.
  const isLegacyEmergency = courseId.startsWith('emergency');
  const Stage = isLegacyEmergency ? SlideStageLegacy : SlideStage;
  const Header = isLegacyEmergency ? PlayerHeaderLegacy : PlayerHeader;
  const Menu = isLegacyEmergency ? SlideMenuLegacy : SlideMenu;
  const Help = isLegacyEmergency ? HelpOverlayLegacy : HelpOverlay;
  const RouteIcon = isLegacyEmergency ? IconLegacy : Icon;

  // Header/footer are overlays, not permanent layout rows -- the page's real
  // footprint is only the 16:9 body rectangle (LMS embeds size the iframe to
  // that box). Chrome slides in on hover-near-edge / the toggle button, and
  // auto-hides shortly after load or when the learner interacts with the
  // slide itself.
  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeHideTimer = useRef<number | null>(null);
  const clearChromeHideTimer = useCallback(() => {
    if (chromeHideTimer.current !== null) {
      window.clearTimeout(chromeHideTimer.current);
      chromeHideTimer.current = null;
    }
  }, []);
  const showChrome = useCallback(() => {
    clearChromeHideTimer();
    setChromeVisible(true);
  }, [clearChromeHideTimer]);
  const scheduleHideChrome = useCallback((delay = 550) => {
    clearChromeHideTimer();
    chromeHideTimer.current = window.setTimeout(() => setChromeVisible(false), delay);
  }, [clearChromeHideTimer]);
  const hideChromeNow = useCallback(() => {
    clearChromeHideTimer();
    setChromeVisible(false);
  }, [clearChromeHideTimer]);
  const toggleChrome = useCallback(() => {
    if (chromeVisible) hideChromeNow();
    else showChrome();
  }, [chromeVisible, hideChromeNow, showChrome]);
  useEffect(() => {
    // Give first-time visitors a brief glimpse of the controls, then tuck
    // them away so the body stays the only permanent on-screen footprint.
    scheduleHideChrome(2600);
    return clearChromeHideTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative h-[100dvh] overflow-hidden ${isLegacyEmergency ? 'legacy-bag2-scope' : ''}`}>
      <BackgroundDecor />

      {/* Body — the only permanent-footprint region. Header/footer overlay
          on top of it instead of pushing it, so the LMS iframe only ever
          needs to fit this 16:9 rectangle. */}
      <main
        className={`player-main absolute inset-0 flex items-center justify-center overflow-hidden p-2 sm:p-3 ${chromeVisible ? 'player-main--chrome-visible' : ''}`}
        onClick={() => chromeVisible && hideChromeNow()}
      >
        <div key={`${slide.id}#${replayNonce}`} className="h-full w-full animate-fade-in">
          <SlideCanvas variant={slide.kind === 'welcome' ? 'intro' : 'default'}>
            <Stage
              slide={slide}
              spoken={sync.spoken}
              started={started}
              muted={muted}
              showDialogue={showDialogue}
              onStart={start}
              onActivityDone={(id) => progress.markActivityDone(id)}
              onQuizComplete={(score) => {
                progress.setQuizScore(score);
                progress.markComplete(slide.id);
              }}
              completion={{
                percent: Math.round(((index + 1) / slides.length) * 100),
                quizScore: progress.state.quizScore,
                activitiesDone: progress.state.activitiesDone.filter((id) =>
                  slides.some((s) => s.id === id && s.kind === 'activity'),
                ).length,
                totalActivities,
                onRestart: restartCourse,
                onExit: exit,
              }}
            />
            <div className="pointer-events-none absolute inset-x-6 bottom-3 z-50 flex justify-center">
              <div className="player-embedded-controls pointer-events-auto flex w-full max-w-3xl items-center gap-2 rounded-2xl bg-black/35 px-3 py-1.5 shadow-card backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => goTo(index - 1)}
                    disabled={index === 0}
                    aria-label="الشريحة السابقة"
                    title="الشريحة السابقة"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-card transition-opacity hover:opacity-85 disabled:pointer-events-none disabled:opacity-30"
                    style={{ background: 'rgb(var(--gold))' }}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    aria-label={voicePlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                    title={voicePlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-card"
                    style={{ background: 'rgb(var(--brand))' }}
                  >
                    {narration.isLoading ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : voicePlaying ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReplay}
                    aria-label="إعادة الشريحة"
                    title="إعادة الشريحة"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-card transition-opacity hover:opacity-85"
                    style={{ background: 'rgb(var(--gold))' }}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 3v4h4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
                    title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-card transition-opacity hover:opacity-85"
                    style={{ background: 'rgb(var(--gold))' }}
                  >
                    {muted ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 9v6h4l5 4V5L8 9z" />
                        <path d="M17 9l4 6M21 9l-4 6" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 9v6h4l5 4V5L8 9z" />
                        <path d="M16 9a4 4 0 010 6" />
                      </svg>
                    )}
                  </button>

                  <div className="mx-1 flex min-w-0 flex-1 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full transition-[width] duration-200 ease-linear"
                        style={{
                          width: `${Math.round(sync.progress * 100)}%`,
                          background: 'rgb(var(--brand))',
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-white/90 tabular">
                      {toArabicDigits(index + 1)} / {toArabicDigits(slides.length)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => (index === slides.length - 1 ? exit() : goTo(index + 1))}
                    aria-label={index === slides.length - 1 ? 'إنهاء والعودة للمنصة' : 'الشريحة التالية'}
                    title={index === slides.length - 1 ? 'إنهاء والعودة للمنصة' : 'الشريحة التالية'}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-card transition-opacity hover:opacity-85"
                    style={{ background: 'rgb(var(--gold))' }}
                  >
                    {index === slides.length - 1 ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 11l9-8 9 8" />
                        <path d="M5 10v10h14V10" />
                        <path d="M10 20v-6h4v6" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 6l-6 6 6 6" />
                      </svg>
                    )}
                </button>
              </div>
            </div>
          </SlideCanvas>
        </div>
      </main>

      {/* Hover-near-edge hot zone (desktop mouse) — reveal the header
          without needing the toggle button. Harmless no-op on touch. The
          footer is now the always-visible embedded bar, so there's no
          bottom zone for it anymore. */}
      <div
        className="absolute inset-x-0 top-0 z-30 h-6"
        onMouseEnter={showChrome}
        aria-hidden="true"
      />

      {/* Single toggle — always reachable, on every device, for showing or
          collapsing the header. The footer is the small embedded bar
          (always visible), so this only ever affects the header. */}
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          toggleChrome();
        }}
        aria-label={chromeVisible ? 'إخفاء الهيدر' : 'إظهار الهيدر'}
        title={chromeVisible ? 'إخفاء الهيدر' : 'إظهار الهيدر'}
        className="absolute left-1/2 top-1.5 z-[100] flex h-6 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-black/25 text-white/90 shadow-card backdrop-blur-sm transition-all hover:bg-black/40"
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 transition-transform duration-300 ${chromeVisible ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6-6 6" />
        </svg>
      </button>

      {/* Header overlay */}
      <div
        className={`absolute inset-x-0 top-0 z-[90] transition-all duration-300 ease-out ${
          chromeVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
        onMouseEnter={showChrome}
        onMouseLeave={() => scheduleHideChrome()}
      >
        <Header
          courseTitle={`${courseMeta.title} · ${courseMeta.chapter}`}
          slideTitle={displaySlideTitle}
          sectionLabel={SECTION_LABEL[slide.kind] ?? 'شرح مصوّر'}
          index={index}
          total={slides.length}
          onExit={exit}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
        />
      </div>

      {/* The closing screen's exit/restart buttons live inside the fixed
          16:9 canvas, so on a narrow phone they shrink down with everything
          else and become too small to tap reliably. This duplicates them at
          a real, always-tappable size — mobile only, canvas design untouched.
          Kept above the footer overlay so it's reachable even while chrome
          is tucked away. */}
      {((slide.kind === 'completion' && (isLegacyEmergency || (!slide.id.startsWith('ec') && !slide.id.startsWith('emergency')))) ||
        slide.layout === 'pptConclusion') && (
        <div className="absolute inset-x-0 bottom-2 z-[45] flex items-center justify-center gap-3 px-4 sm:hidden">
          <button type="button" onClick={exit} className="btn-gold min-h-[48px] flex-1 max-w-[220px] justify-center text-[15px]">
            <RouteIcon name="flag" className="h-5 w-5" />
            إنهاء والعودة للمنصة
          </button>
          <button type="button" onClick={restartCourse} className="btn-ghost min-h-[48px] flex-1 max-w-[220px] justify-center text-[15px]">
            <RouteIcon name="flow" className="h-5 w-5" />
            إعادة الفصل
          </button>
        </div>
      )}

      <Menu
        slides={slides}
        current={index}
        visited={progress.isComplete}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onJump={goTo}
      />

      {helpOpen && <Help onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
