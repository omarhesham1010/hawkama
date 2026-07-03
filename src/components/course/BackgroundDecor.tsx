/**
 * Ambient animated background inspired by the PowerPoint's green/gold swoosh.
 * Soft floating blobs + a gentle bottom wave. Sits behind everything, never
 * interactive, and stays subtle so cards remain perfectly readable.
 */
export function BackgroundDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* floating color blobs */}
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-green-400/20 blur-3xl animate-blob dark:bg-green-500/15" />
      <div
        className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-gold-300/20 blur-3xl animate-blob dark:bg-gold-500/10"
        style={{ animationDelay: '3s' }}
      />
      <div
        className="absolute bottom-10 left-1/4 h-72 w-72 rounded-full bg-green-300/15 blur-3xl animate-blob dark:bg-green-400/10"
        style={{ animationDelay: '6s' }}
      />

      {/* faint dotted grid for depth */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(rgb(var(--brand) / 0.18) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black, transparent 70%)',
        }}
      />

      {/* PPT-style bottom swoosh */}
      <svg
        className="absolute inset-x-0 bottom-0 w-full animate-float-slow"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: '38vh', minHeight: 220 }}
      >
        <path
          fill="rgb(var(--brand) / 0.10)"
          d="M0,224 C240,288 480,160 720,176 C960,192 1200,288 1440,224 L1440,320 L0,320 Z"
        />
        <path
          fill="rgb(var(--brand) / 0.16)"
          d="M0,256 C280,320 560,208 840,224 C1120,240 1320,304 1440,272 L1440,320 L0,320 Z"
        />
        <path
          fill="rgb(191 155 74 / 0.10)"
          d="M0,288 C360,240 720,320 1080,296 C1260,284 1360,300 1440,296 L1440,320 L0,320 Z"
        />
      </svg>
    </div>
  );
}
