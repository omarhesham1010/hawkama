import type { Config } from 'tailwindcss';

/**
 * Identity taken from the source PowerPoint: corporate **green** + **gold**,
 * white cards, soft neutrals. Colors are exposed as CSS variables
 * (see src/styles/index.css) so light & dark themes swap surfaces without
 * changing component classes.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Entrance animations are applied dynamically (`animate-${beat.anim}`), so the
  // JIT can't see them in source — safelist guarantees they're generated.
  safelist: [
    'animate-fade-up',
    'animate-fade-in',
    'animate-slide-in',
    'animate-scale-in',
    'animate-zoom',
    'animate-rise',
    'animate-flip',
    'animate-swing-in',
    'animate-pop',
    'animate-epic-pop',
    'animate-crown-rise',
    'animate-ring-shockwave',
    'animate-glow-cycle',
    'animate-shimmer-sweep',
    'animate-aura-spin',
    'animate-sparkle',
    'animate-shot-fade-out',
    'animate-shot-fade-in',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ministry green (#008755, from the ministry logo) -- every step is a
        // tint/shade of this ONE hue, not an independent color, per the
        // client's strict two-color identity directive (no other shades).
        green: {
          50: '#f2f9f7',
          100: '#e0f1eb',
          200: '#bde0d3',
          300: '#8cc9b3',
          400: '#4cab88',
          500: '#008755',
          600: '#007348',
          700: '#005f3c',
          800: '#004a2f',
          900: '#003622',
          950: '#002215',
        },
        // Ministry gold (#9B945F, from the ministry logo) -- same rule.
        gold: {
          50: '#fafaf7',
          100: '#f3f2ec',
          200: '#e5e3d5',
          300: '#d2cfb7',
          400: '#b9b48f',
          500: '#9b945f',
          600: '#847e51',
          700: '#6d6843',
          800: '#555134',
          900: '#3e3b26',
        },
        // Semantic surfaces driven by CSS variables (theme-aware)
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        'ink-muted': 'rgb(var(--ink-muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        'brand-soft': 'rgb(var(--brand-soft) / <alpha-value>)',
        'brand-strong': 'rgb(var(--brand-strong) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', '"Tajawal"', 'system-ui', 'sans-serif'],
        display: ['"Tajawal"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.15rem',
        '3xl': '1.6rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(21 56 38 / 0.06), 0 6px 16px -6px rgb(21 56 38 / 0.16), 0 12px 30px -12px rgb(21 56 38 / 0.22)',
        'card-lg': '0 2px 6px rgb(21 56 38 / 0.08), 0 24px 60px -22px rgb(21 56 38 / 0.42)',
        glow: '0 0 0 1px rgb(var(--brand) / 0.3), 0 14px 40px -12px rgb(var(--brand) / 0.4)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(34px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        zoom: {
          '0%': { opacity: '0', transform: 'scale(.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(30px) scale(.98)' },
          '60%': { transform: 'translateY(-4px) scale(1.01)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        flip: {
          '0%': { opacity: '0', transform: 'perspective(700px) rotateX(-70deg)' },
          '100%': { opacity: '1', transform: 'perspective(700px) rotateX(0deg)' },
        },
        'swing-in': {
          '0%': { opacity: '0', transform: 'rotate(-6deg) translateX(28px)' },
          '100%': { opacity: '1', transform: 'rotate(0) translateX(0)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(.8)' },
          '60%': { transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(18px,-14px) scale(1.06)' },
          '66%': { transform: 'translate(-14px,10px) scale(0.96)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(var(--brand) / 0.45)' },
          '70%': { boxShadow: '0 0 0 12px rgb(var(--brand) / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(var(--brand) / 0)' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(140px) rotate(420deg)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'draw-in': {
          '0%': { 'stroke-dashoffset': '1' },
          '100%': { 'stroke-dashoffset': '0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.06)' },
        },
        'orbit-drift': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '33%': { transform: 'translateY(-6px) translateX(3px)' },
          '66%': { transform: 'translateY(4px) translateX(-4px)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'epic-pop': {
          '0%': { opacity: '0', transform: 'scale(.62) rotate(-10deg) translateY(26px)', filter: 'blur(6px)' },
          '55%': { opacity: '1', transform: 'scale(1.08) rotate(2deg) translateY(-6px)', filter: 'blur(0)' },
          '75%': { transform: 'scale(0.97) rotate(-1deg) translateY(2px)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg) translateY(0)', filter: 'blur(0)' },
        },
        'ring-shockwave': {
          '0%': { transform: 'scale(0.6)', opacity: '0.9', boxShadow: '0 0 0 0 rgb(191 155 74 / 0.55)' },
          '70%': { opacity: '0.25' },
          '100%': { transform: 'scale(1)', opacity: '0', boxShadow: '0 0 0 18px rgb(191 155 74 / 0)' },
        },
        'glow-cycle': {
          '0%, 100%': { filter: 'drop-shadow(0 18px 26px rgb(24 82 55 / 0.22))' },
          '33%': { filter: 'drop-shadow(0 26px 34px rgb(191 155 74 / 0.32))' },
          '66%': { filter: 'drop-shadow(0 22px 30px rgb(23 150 132 / 0.28))' },
        },
        'shimmer-sweep': {
          '0%': { backgroundPosition: '-150% 0' },
          '100%': { backgroundPosition: '250% 0' },
        },
        'crown-rise': {
          '0%': { opacity: '0', transform: 'scale(.4) translateY(18px) rotate(-20deg)' },
          '50%': { opacity: '1', transform: 'scale(1.15) translateY(-4px) rotate(6deg)' },
          '70%': { transform: 'scale(0.95) rotate(-2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0) rotate(0deg)' },
        },
        'aura-spin': {
          '0%': { transform: 'rotate(0deg)', opacity: '0.5' },
          '50%': { opacity: '0.9' },
          '100%': { transform: 'rotate(360deg)', opacity: '0.5' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0', transform: 'scale(0.4) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1) rotate(90deg)' },
        },
        'shot-fade-out': {
          '0%': { opacity: '1', transform: 'scale(1)', filter: 'blur(0)' },
          '100%': { opacity: '0', transform: 'scale(0.96)', filter: 'blur(2px)' },
        },
        'shot-fade-in': {
          '0%': { opacity: '0', transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'draw-in': 'draw-in 1.6s cubic-bezier(.22,1,.36,1) forwards',
        'pulse-soft': 'pulse-soft 3.2s ease-in-out infinite',
        'orbit-drift': 'orbit-drift 7s ease-in-out infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
        'epic-pop': 'epic-pop .85s cubic-bezier(.2,1.1,.3,1) both',
        'ring-shockwave': 'ring-shockwave 1.6s cubic-bezier(.22,1,.36,1) infinite',
        'glow-cycle': 'glow-cycle 3.4s ease-in-out infinite',
        'shimmer-sweep': 'shimmer-sweep 2.6s linear infinite',
        'crown-rise': 'crown-rise .9s cubic-bezier(.2,1.2,.3,1) both',
        'aura-spin': 'aura-spin 5s linear infinite',
        sparkle: 'sparkle 1.8s ease-in-out infinite',
        'shot-fade-out': 'shot-fade-out .5s cubic-bezier(.4,0,.7,1) both',
        'shot-fade-in': 'shot-fade-in .5s cubic-bezier(.2,1,.36,1) both',
        'fade-up': 'fade-up .55s cubic-bezier(.22,1,.36,1) both',
        'fade-in': 'fade-in .45s ease-out both',
        'scale-in': 'scale-in .4s cubic-bezier(.22,1,.36,1) both',
        'slide-in': 'slide-in .5s cubic-bezier(.22,1,.36,1) both',
        zoom: 'zoom .5s cubic-bezier(.34,1.4,.5,1) both',
        rise: 'rise .6s cubic-bezier(.22,1.2,.36,1) both',
        flip: 'flip .6s cubic-bezier(.22,1,.36,1) both',
        'swing-in': 'swing-in .55s cubic-bezier(.34,1.3,.5,1) both',
        pop: 'pop .45s cubic-bezier(.34,1.56,.64,1) both',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        blob: 'blob 20s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(.22,1,.36,1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
