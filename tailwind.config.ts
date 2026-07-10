import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './stores/**/*.{ts,tsx}',
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d8ecff',
          200: '#b7ddff',
          300: '#83c8ff',
          400: '#48a8ff',
          500: '#1677ff',
          600: '#0f5ed7',
          700: '#104cad',
          800: '#13428c',
          900: '#153a75',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      boxShadow: {
        soft: '0 18px 50px rgba(15, 23, 42, 0.08)',
        card: '0 18px 44px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        glow: '0 24px 80px rgba(22, 119, 255, 0.24)',
      },
      borderRadius: {
        control: '14px',
        card: '24px',
      },
    },
  },
  plugins: [],
};

export default config;
