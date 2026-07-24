export function SlideTemplateFrame({ variant = 'default' }: { variant?: 'default' | 'intro' }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-white" aria-hidden="true">
      <img
        src="/template-assets/program-template-bg.webp"
        alt=""
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
      {variant === 'intro' ? (
        <>
          <img
            src="/template-assets/ministry-logo.svg"
            alt=""
            className="absolute left-6 top-6 h-[92px] w-[92px] object-contain"
            loading="eager"
            decoding="async"
            draggable={false}
          />
          <img
            src="/template-assets/intro-topright-swoosh.webp?v=2"
            alt=""
            className="absolute right-0 top-0 h-[135px] w-[440px] object-contain object-right-top"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            draggable={false}
          />
        </>
      ) : (
        <img
          src="/template-assets/top-left-identity-mark-color.webp?v=2"
          alt=""
          className="absolute left-0 top-0 h-[135px] w-[440px] object-contain object-left-top opacity-100"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable={false}
        />
      )}
    </div>
  );
}
