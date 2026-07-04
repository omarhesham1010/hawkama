export function SlideTemplateFrame() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-white" aria-hidden="true">
      <img
        src="/template-assets/program-template-bg.png"
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
      <img
        src="/template-assets/top-left-identity-mark-color.png"
        alt=""
        className="absolute -left-1 -top-1 h-[216px] w-[260px] object-contain opacity-100"
        draggable={false}
      />
    </div>
  );
}
