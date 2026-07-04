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
        src="/template-assets/vision-watermark.png"
        alt=""
        className="absolute -left-[18px] -top-[4px] h-[172px] w-[330px] object-contain opacity-[0.32]"
        draggable={false}
      />
    </div>
  );
}
