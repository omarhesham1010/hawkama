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
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand green (from the PPT header boxes)
        green: {
          50: '#eef6f1',
          100: '#d3e9dc',
          200: '#a8d3ba',
          300: '#74b791',
          400: '#459c6c',
          500: '#2f8457',
          600: '#256b47',
          700: '#1f5638',
          800: '#1a442e',
          900: '#153826',
          950: '#0c1f15',
        },
        // Gold (from the PPT third column)
        gold: {
          50: '#faf6ea',
          100: '#f2e8c9',
          200: '#e6d095',
          300: '#d8b866',
          400: '#c9a24a',
          500: '#bf9b4a',
          600: '#9d7f38',
          700: '#7c632c',
          800: '#5f4c24',
          900: '#4d3e20',
        },
        // Kept for success/correct states (a cooler green so it reads distinct from brand)
        teal: {
          50: '#e6faf7',
          100: '#c9f2ee',
          200: '#9be6df',
          300: '#63d3c9',
          400: '#31b8ae',
          500: '#149a90',
          600: '#0e7c7b',
          700: '#0f6263',
          800: '#114e50',
          900: '#123f41',
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
      },
      animation: {
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
