import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:         'var(--bg)',
        surface:    'var(--surface)',
        surface2:   'var(--surface2)',
        surface3:   'var(--surface3)',
        border:     'var(--border)',
        faint:      'var(--faint)',
        muted:      'var(--muted)',
        foreground: 'var(--text)',
        primary: {
          DEFAULT: 'var(--primary)',
          dim:     'var(--primary-dim)',
          glow:    'var(--primary-glow)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          dim:     'var(--accent-dim)',
          glow:    'var(--accent-glow)',
        },
        warm: {
          DEFAULT: '#FF6B6B',
          dim:     '#FF6B6B22',
        },
      },
      fontFamily: {
        syne: ['var(--font-syne)', 'sans-serif'],
        dm:   ['var(--font-dm-sans)', 'sans-serif'],
      },
      backgroundImage: {
        'grad':      'linear-gradient(135deg, #7B6EFF, #00E5A0)',
        'grad-warm': 'linear-gradient(135deg, #FF6B6B, #7B6EFF)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        bump: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':       { transform: 'scale(1.5)' },
        },
        pulse2: {
          '0%':   { opacity: '0.8', transform: 'scale(1)' },
          '100%': { opacity: '0',   transform: 'scale(1.5)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.3' },
        },
        typingDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)',    opacity: '0.4' },
          '30%':            { transform: 'translateY(-6px)', opacity: '1' },
        },
        bounce2: {
          '0%':   { transform: 'scale(0)' },
          '70%':  { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmerMove: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        gradShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        bannerPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.88', transform: 'scale(1.012)' },
        },
      },
      animation: {
        'fade-up':     'fadeUp 0.5s ease both',
        'slide-down':  'slideDown 0.5s ease',
        'bump':        'bump 0.3s ease',
        'pulse2':      'pulse2 2s infinite',
        'blink':       'blink 1.5s infinite',
        'typing-dot':  'typingDot 1.2s infinite',
        'bounce2':     'bounce2 0.5s ease',
        'shimmer-move':'shimmerMove 2.5s linear infinite',
        'grad-shift':  'gradShift 6s ease infinite',
        'banner-pulse':'bannerPulse 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
