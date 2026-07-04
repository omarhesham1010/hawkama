export function SlideTemplateFrame() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-white" aria-hidden="true">
      <img
        src="/template-assets/program-template-bg.png"
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
