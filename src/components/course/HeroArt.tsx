/**
 * Premium abstract "governance network" hero — pure SVG, theme-aware via CSS vars.
 * A central shield (governance) linked to orbiting nodes (board, committees,
 * policies, compliance) — no stock imagery, no people.
 */
export function HeroArt({ className = '' }: { className?: string }) {
  const nodes = [
    { x: 250, y: 60 },
    { x: 400, y: 130 },
    { x: 410, y: 300 },
    { x: 250, y: 360 },
    { x: 95, y: 300 },
    { x: 85, y: 130 },
  ];
  return (
    <svg viewBox="0 0 500 420" className={className} role="img" aria-label="رسم تجريدي لشبكة الحوكمة">
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="rgb(var(--brand) / 0.22)" />
          <stop offset="100%" stopColor="rgb(var(--brand) / 0)" />
        </radialGradient>
        <linearGradient id="hero-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgb(var(--brand-soft))" />
          <stop offset="1" stopColor="rgb(var(--brand))" />
        </linearGradient>
      </defs>

      <circle cx="250" cy="205" r="200" fill="url(#hero-glow)" />

      {/* connecting lines */}
      {nodes.map((n, i) => (
        <line
          key={i}
          x1="250"
          y1="205"
          x2={n.x}
          y2={n.y}
          stroke="rgb(var(--brand) / 0.35)"
          strokeWidth="1.5"
          strokeDasharray="4 5"
        />
      ))}

      {/* orbit ring */}
      <circle
        cx="250"
        cy="205"
        r="150"
        fill="none"
        stroke="rgb(var(--line))"
        strokeWidth="1.5"
        strokeDasharray="2 8"
      />

      {/* outer nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r="16" fill="rgb(var(--surface))" stroke="rgb(var(--brand) / 0.5)" strokeWidth="1.5" />
          <circle cx={n.x} cy={n.y} r="6" fill="rgb(var(--brand))" />
        </g>
      ))}

      {/* central shield */}
      <g transform="translate(250 205)">
        <circle r="66" fill="rgb(var(--surface))" stroke="rgb(var(--line))" strokeWidth="1.5" />
        <path
          d="M0 -42l34 15v22c0 24-17 40-34 47-17-7-34-23-34-47v-22z"
          fill="url(#hero-shield)"
        />
        <path
          d="M-14 2l10 10 20-22"
          fill="none"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle r="4" cx="0" cy="-58" fill="#9b945f" />
      </g>
    </svg>
  );
}
