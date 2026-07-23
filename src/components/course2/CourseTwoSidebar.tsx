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
        <div className="scroll-slim flex h-full w-[300px] flex-col overflow-y-auto">
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
          <nav className="flex-1 space-y-1 bg-[#7EC7A0] p-3">
        {groups.map((group, gi) => {
          const isOpen = openGroup === gi;
          const isActiveGroup = gi === activeGroup;
          return (
            <div key={group.label} className="rounded-xl">
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? -1 : gi)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition-colors ${
                  isActiveGroup ? 'bg-brand/12 ring-1 ring-brand/30' : 'hover:bg-surface-2'
                }`}
                aria-expanded={isOpen}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    isActiveGroup ? 'bg-brand text-white' : 'bg-surface-3 text-ink-muted'
                  }`}
                >
                  {gi + 1}
                </span>
                <span
                  className={`flex-1 truncate text-sm ${
                    isActiveGroup ? 'font-bold text-ink' : 'font-medium text-ink-soft'
                  }`}
                >
                  {group.label}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 ${isOpen ? '-rotate-90' : 'rotate-90'}`}
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
                <div className="mr-4 mt-1 space-y-0.5 border-e border-line pe-3">
                  {group.slides.map((slide, si) => {
                    const globalIndex = group.startIndex + si;
                    const active = globalIndex === activeIndex;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => onJump(globalIndex)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-right text-xs transition-colors ${
                          active ? 'bg-brand/12 font-bold text-brand' : 'text-ink-soft hover:bg-surface-2'
                        }`}
                        aria-current={active ? 'step' : undefined}
                      >
                        <span className="w-4 shrink-0 tabular text-[10px] text-ink-muted">
                          {toArabicDigits(si + 1)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{slide.title}</span>
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
      </aside>
    </>
  );
}
