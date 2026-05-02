import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#4F46E5', light: '#6366F1', dark: '#3730A3' },
        secondary: { DEFAULT: '#06B6D4', light: '#22D3EE' },
        success:   { DEFAULT: '#22C55E' },
        warning:   { DEFAULT: '#F59E0B' },
        danger:    { DEFAULT: '#EF4444' },
        bg:        { DEFAULT: '#0F172A', 2: '#111827' },
        card:      { DEFAULT: '#1E293B', 2: '#263245' },
        border:    'rgba(255,255,255,0.08)',
        // Landing page colors
        'bg-dark': '#0B1120',
        'bg-darker': '#020617',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'Syne', 'sans-serif'],
        body:    ['var(--font-inter)', 'DM Sans', 'sans-serif'],
        mono:    ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        syne:    ['var(--font-syne)', 'Syne', 'sans-serif'],
        inter:   ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'grad-brand':   'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
        'grad-success': 'linear-gradient(135deg, #22C55E 0%, #10B981 100%)',
        'grad-warn':    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        'grad-card':    'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(6,182,212,0.08))',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-up':   'slideUp 0.4s ease forwards',
        'slide-left': 'slideLeft 0.3s ease forwards',
        'pulse-slow': 'pulse 3s infinite',
        'count-up':   'countUp 1s ease forwards',
        'spin-slow':  'spin 20s linear infinite',
        'float':      'float 6s ease-in-out infinite',
        'border-flow': 'border-flow 4s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideLeft: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      boxShadow: {
        'glow-primary':   '0 0 30px rgba(79,70,229,0.4)',
        'glow-secondary': '0 0 30px rgba(6,182,212,0.3)',
        'glow-success':   '0 0 20px rgba(34,197,94,0.3)',
        'card-hover':     '0 8px 40px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};
export default config;
