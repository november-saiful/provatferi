import type { Config } from 'tailwindcss';

/* ──────────────────────────────────────────────────────────────────────
 * Z-Index Scale
 * ──────────────────────────────────────────────────────────────────────
 *
 * Every z-index in the app must map to exactly ONE of the layers below.
 * When adding a new positioned element, pick the layer that matches its
 * role — never invent a new value.  If two layers feel equally correct,
 * pick the LOWER one and bump the higher layer only if it truly needs to
 * float above the other.
 *
 *   z-0   (layer 0)   Base content — cards, grid cells, album cards at rest
 *   z-10  (layer 10)  In-card interactive accents — save buttons, tab
 *                      indicators, table theads, event overlays, album
 *                      center card, notice wall hover/focus
 *   z-20  (layer 20)  Sticky sub-navigation — filter bars, section headers
 *                      that scroll with main content but below app chrome
 *   z-40  (layer 40)  App chrome — the top header bar, sidebar if any
 *   z-50  (layer 50)  Floating panels — dropdown menus, dialog overlays,
 *                      gallery fullscreen, floating bottom nav
 *   z-60  (layer 60)  Tooltips — gallery sort tooltip, contextual tips
 *   z-100 (layer 100) Escape-proof overlays — calendar tooltip that must
 *                      never be clipped by any ancestor overflow
 *   z-[-1]            Decorative pseudo-elements (::after, ::before)
 *
 * Gap between layers is intentional (10, 20, 40 …) so new layers can be
 * inserted if needed without a full renumber.
 * ────────────────────────────────────────────────────────────────────── */

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          active: 'hsl(var(--sidebar-active-foreground))',
          border: 'hsl(var(--sidebar-border))'
        },
        coffee: {
          DEFAULT: '#93452A',
          50: '#fdf5f1',
          100: '#f8e4db',
          200: '#f0c9b7',
          300: '#e5a48b',
          400: '#d87e5e',
          500: '#c5623e',
          600: '#a94f34',
          700: '#93452A',
          800: '#7a3922',
          900: '#5c2b19',
          950: '#3e1c10'
        },
        gold: {
          DEFAULT: '#C68A1A',
          50: '#fef9ee',
          100: '#fcf0d4',
          200: '#f8dea3',
          300: '#f3c768',
          400: '#edad33',
          500: '#d99816',
          600: '#C68A1A',
          700: '#9a6914',
          800: '#7b5316',
          900: '#634418',
          950: '#39240a'
        },
        taupe: {
          DEFAULT: '#8D6E63',
          50: '#F7F3F1',
          100: '#EEE3DF',
          200: '#DBC4BC',
          300: '#C3A093',
          400: '#A97F70',
          500: '#8D6E63',
          600: '#71564D',
          700: '#57423B',
          800: '#3E2F2A',
          900: '#261C18'
        },
        sage: {
          DEFAULT: '#5C8A67',
          50: '#F2F6F3',
          100: '#E1EBE4',
          200: '#C3D6C8',
          300: '#9CBB9F',
          400: '#769E7A',
          500: '#5C8A67',
          600: '#4A6F53',
          700: '#3A5740',
          800: '#2B3F2F',
          900: '#1C281E'
        },
        cream: {
          DEFAULT: '#F5EFE6',
          50: '#FDFBF8',
          100: '#F9F3EC',
          200: '#F5EFE6',
          300: '#EBDFCC',
          400: '#DFC9A8'
        },
        amber: {
          DEFAULT: '#D4A017',
          50: '#FDF8EC',
          100: '#FAEDC8',
          200: '#F0D98C',
          300: '#E5C35A',
          400: '#D9AD2C',
          500: '#D4A017',
          600: '#A87C11',
          700: '#7E5C0D',
          800: '#564008',
          900: '#2E2204'
        },
        warmred: {
          DEFAULT: '#C62828',
          50: '#FDEEEE',
          100: '#F8D2D2',
          200: '#EFA6A6',
          300: '#E47777',
          400: '#D64F4F',
          500: '#C62828',
          600: '#A01F1F',
          700: '#7A1818',
          800: '#551111',
          900: '#300A0A'
        }
      },
      borderRadius: {
        xl2: 'var(--radius)',
        'xl3': 'var(--radius-lg)',
        'xl4': 'var(--radius-xl)'
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'glow': 'var(--shadow-glow)',
        'glow-lg': 'var(--shadow-glow-lg)',
        'soft': '0 2px 12px rgba(119,55,34,0.05)',
        'lift': '0 4px 20px rgba(119,55,34,0.08), 0 1px 4px rgba(119,55,34,0.04)',
        'lift-lg': '0 8px 30px rgba(119,55,34,0.1), 0 2px 8px rgba(119,55,34,0.05)'
      },
      fontFamily: {
        sans: [
          'var(--font-noto-serif-bengali)',
          'var(--font-inter)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ]
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms'
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)'
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(0.5deg)' },
          '66%': { transform: 'translateY(-4px) rotate(-0.5deg)' }
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%': { transform: 'translateY(-24px) translateX(12px)' }
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.08)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '150% 50%' },
          '100%': { backgroundPosition: '-50% 50%' }
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'hsl(var(--primary) / 0.1)' },
          '50%': { borderColor: 'hsl(var(--primary) / 0.3)' }
        },
        breathe: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '0.8' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'float-slow 10s ease-in-out infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        'glow-pulse': 'glow-pulse 5s ease-in-out infinite',
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'border-glow': 'border-glow 3s ease-in-out infinite',
        breathe: 'breathe 3s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
