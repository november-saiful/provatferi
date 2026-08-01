import type { Config } from 'tailwindcss';

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
        coffee: {
          DEFAULT: '#93452A',
          50: '#fcf2ef',
          100: '#f4ded7',
          200: '#e9beaf',
          300: '#db9780',
          400: '#ce6f50',
          500: '#b75434',
          600: '#9f492d',
          700: '#93452A',
          800: '#773722',
          900: '#582819',
          950: '#3c1c11'
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
          DEFAULT: '#4E7C5C',
          50: '#F0F5F1',
          100: '#DCE8DF',
          200: '#BCD2C2',
          300: '#94B59E',
          400: '#6C977A',
          500: '#4E7C5C',
          600: '#3E6449',
          700: '#304D38',
          800: '#233829',
          900: '#162219'
        },
        cream: {
          DEFAULT: '#F5EFE6',
          50: '#FDFBF7',
          100: '#F5EFE6',
          200: '#EBDFCC',
          300: '#DFC9A8'
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
        xl2: '1rem'
      },
      boxShadow: {
        soft: '0 2px 12px rgba(119,55,34,0.06)',
        lift: '0 8px 24px rgba(119,55,34,0.12)'
      },
      fontFamily: {
        sans: [
          'Inter',
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
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.18s ease-out'
      }
    }
  },
  plugins: []
};

export default config;
