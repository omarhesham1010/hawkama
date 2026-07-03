/** Footer navigation: previous + primary continue button. RTL-aware chevrons. */
export function SectionNav({
  onPrev,
  onNext,
  isFirst,
  isLast,
  nextLabel = 'متابعة',
}: {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-10 flex items-center justify-between border-t border-line pt-5">
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirst}
        className="btn-ghost px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
      >
        {/* points right in RTL = "back" */}
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
        السابق
      </button>

      {!isLast && (
        <button type="button" onClick={onNext} className="btn-primary px-6 py-2.5 text-sm">
          {nextLabel}
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
