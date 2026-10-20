/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Blu-ardesia luminoso e satinato (Midnight Slate Studio)
        ink: {
          950: '#121826', // Fondo pagina: blu notte arioso, mai nero cupo
          900: '#1B2436', // Pannelli principali: ardesia satinata chiara
          850: '#222D42', // Pannelli secondari / hover
          800: '#2B3852', // Bordi e separatori luminosi
          700: '#384766', // Bordi attivi e controlli
          600: '#516388', // Tacche e icone secondarie
          500: '#7C8FB5', // Etichette serigrafate ben leggibili
          400: '#A6B5D4', // Testo secondario chiaro
          300: '#CBD5E8', // Testo medio
          200: '#E5EBF5', // Testo quasi bianco
          100: '#F8FAFC', // Bianco nitido
        },
        // Segnale: ciano acqua vibrante
        signal: {
          DEFAULT: '#00F2FE',
          300: '#74F8FF',
          500: '#00C8D4',
          700: '#00636A',
        },
        // Tally: corallo/rosso luminoso ON AIR / REC
        tally: {
          DEFAULT: '#FF5247',
          600: '#E03E33',
        },
        // Cue: ambra dorata per note del coach, streak e accenti caldi
        cue: {
          DEFAULT: '#FFB830',
          300: '#FFD885',
        },
        // Go: smeraldo brillante
        go: {
          DEFAULT: '#38E8A6',
        },
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'ring-pulse': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '100%': { transform: 'scale(1.7)', opacity: '0' },
        },
      },
      animation: {
        rise: 'rise .5s cubic-bezier(.2,.7,.2,1) both',
        fade: 'fade .25s ease-out both',
        blink: 'blink 1.6s ease-in-out infinite',
        'ring-pulse': 'ring-pulse 1.4s cubic-bezier(.2,.7,.2,1) infinite',
      },
    },
  },
  plugins: [],
};
