export function SlideTemplateFrame() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-white" aria-hidden="true">
      <img
        src="/template-assets/program-template-bg-legacy.webp"
        alt=""
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
      <img
        src="/template-assets/top-left-identity-mark-color-legacy.webp"
        alt=""
        className="absolute -left-1 -top-1 h-[216px] w-[260px] object-contain opacity-100"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
    </div>
  );
}
