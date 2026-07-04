export function SlideTemplateFrame() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-white" aria-hidden="true">
      <img
        src="/template-assets/vision-watermark.png"
        alt=""
        className="absolute -left-[18px] -top-[4px] h-[172px] w-[330px] object-contain opacity-[0.11]"
        draggable={false}
      />

      <img
        src="/template-assets/moh-capability-ab3ad.png"
        alt=""
        className="absolute right-[136px] top-[12px] h-[86px] w-[240px] object-contain"
        draggable={false}
      />
      <img
        src="/template-assets/ministry-health.png"
        alt=""
        className="absolute right-[20px] top-[14px] h-[56px] w-[198px] object-contain"
        draggable={false}
      />

      <div className="absolute bottom-[25px] left-[109px] right-[18px] h-[2px] bg-[#0D8C60]" />
      <img
        src="/template-assets/moh-logo-small.png"
        alt=""
        className="absolute bottom-[18px] left-[63px] h-[32px] w-[49px] object-contain"
        draggable={false}
      />
      <div className="absolute bottom-[17px] left-[15px] h-[39px] w-[39px] rounded-full border border-[#0D8C60]/20" />
      <div className="absolute bottom-[29px] left-[27px] h-[15px] w-[15px] rounded-full bg-[#0D8C60]/20" />
    </div>
  );
}
