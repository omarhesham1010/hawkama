import { useState } from 'react';
import type { Slide } from '../../types/slides';
import { toArabicDigits } from '../../lib/utils';

export interface CourseTwoGroup {
  label: string;
  /** 0-based index of this group's first slide within the combined sequence. */
  startIndex: number;
  slides: Slide[];
}

function HamburgerIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/** Cosmetic-only preview of the future sequential-unlock gating: shows which
 *  chapters/slides will require finishing everything before them, without
 *  actually restricting navigation yet -- the client still wants free
 *  jumping between slides while the bag is being built. */
function LockIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

/** Persistent (but collapsible) right-side menu for the single-link
 *  course-2 shell: one group per chapter, each expanding to list its real
 *  slides, styled to match the ministry LMS's green identity. */
export function CourseTwoSidebar({
  groups,
  activeIndex,
  onJump,
  open,
  onToggle,
}: {
  groups: CourseTwoGroup[];
  activeIndex: number;
  onJump: (index: number) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const activeGroup = groups.findIndex(
    (g) => activeIndex >= g.startIndex && activeIndex < g.startIndex + g.slides.length,
  );
  const [openGroup, setOpenGroup] = useState<number>(Math.max(0, activeGroup));

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-label="فتح القائمة"
        title="فتح القائمة"
        className={`fixed right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-card transition-all duration-300 ${
          open ? 'pointer-events-none translate-x-2 opacity-0' : 'translate-x-0 opacity-100'
        }`}
      >
        <HamburgerIcon />
      </button>

      <aside
        className={`h-full shrink-0 overflow-hidden rounded-2xl border border-green-700/15 shadow-card transition-[width] duration-300 ease-in-out ${
          open ? 'w-[300px]' : 'w-0 border-0 shadow-none'
        }`}
      >
        {/* dir="ltr" on the scrolling box puts its scrollbar on the right;
            the nested dir="rtl" wrapper keeps all the actual content RTL.
            Without this, Chrome/Firefox place an RTL element's own
            scrollbar on its logical end, i.e. the left. */}
        <div dir="ltr" className="scroll-slim scroll-slim-gold flex h-full w-[300px] flex-col overflow-y-auto">
        <div dir="rtl" className="flex h-full w-full flex-col">
          <div className="flex shrink-0 items-center justify-between bg-brand px-4 py-3.5">
            <p className="text-sm font-bold text-white">محتويات الحقيبة</p>
            <button
              type="button"
              onClick={onToggle}
              aria-label="إغلاق القائمة"
              title="إغلاق القائمة"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
            >
              <HamburgerIcon className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 bg-brand p-3">
        {groups.map((group, gi) => {
          const isOpen = openGroup === gi;
          const isActiveGroup = gi === activeGroup;
          return (
            <div key={group.label} className="rounded-xl">
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? -1 : gi)}
                className={`flex w-full items-center gap-3 rounded-xl border-r-4 px-3 py-2.5 text-right transition-colors hover:bg-gold-500/20 ${
                  isActiveGroup ? 'border-white/80 bg-gold-500/35' : 'border-transparent'
                }`}
                aria-expanded={isOpen}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    isActiveGroup ? 'bg-white text-gold-500' : 'border border-white/40 text-white'
                  }`}
                >
                  {gi + 1}
                </span>
                <span
                  className={`flex-1 truncate text-sm ${
                    isActiveGroup ? 'font-bold text-white' : 'font-medium text-white/85'
                  }`}
                >
                  {group.label}
                </span>
                {gi !== 0 && <LockIcon className="h-3.5 w-3.5 shrink-0 text-white/60" />}
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 shrink-0 text-white/70 transition-transform duration-200 ${isOpen ? '-rotate-90' : 'rotate-90'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>

              {isOpen && (
                <div className="mr-4 mt-1 space-y-0.5 border-e border-white/25 pe-3">
                  {group.slides.map((slide, si) => {
                    const globalIndex = group.startIndex + si;
                    const active = globalIndex === activeIndex;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => onJump(globalIndex)}
                        className={`flex w-full items-center gap-2 rounded-lg border-r-4 px-2.5 py-1.5 text-right text-xs transition-colors hover:bg-gold-500/20 ${
                          active ? 'border-white/80 bg-gold-500/35 font-bold text-white' : 'border-transparent text-white/80'
                        }`}
                        aria-current={active ? 'step' : undefined}
                      >
                        <span className="w-4 shrink-0 tabular text-[10px] text-white/60">
                          {toArabicDigits(si + 1)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{slide.title}</span>
                        {gi !== 0 && <LockIcon className="h-3 w-3 shrink-0 text-white/50" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
          })}
          </nav>
        </div>
        </div>
      </aside>
    </>
  );
}
