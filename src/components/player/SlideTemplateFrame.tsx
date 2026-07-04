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
        src="/template-assets/top-left-identity-mark.png"
        alt=""
        className="absolute left-0 top-0 h-[205px] w-[350px] object-contain opacity-100"
        draggable={false}
      />
    </div>
  );
}
