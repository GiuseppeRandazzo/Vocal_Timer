/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          darkest: '#070A0F',
          darker: '#0B0F17',
          dark: '#111726',
          panel: '#161F33',
          border: '#1E293B',
          muted: '#64748B',
          text: '#F8FAFC',
        },
        cyan: {
          neon: '#00F2FE',
          glow: '#00c6ff',
        },
        violet: {
          neon: '#8B5CF6',
          glow: '#A78BFA',
        },
        onair: {
          red: '#EF4444',
          glow: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(0, 242, 254, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 242, 254, 0.8)' },
        }
      }
    },
  },
  plugins: [],
};
