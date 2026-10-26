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
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        cyber: {
          dark: '#0a0d14',
          card: '#111726',
          border: '#1e293b',
          accent: '#00f2fe',
          hot: '#ff3366',
          gold: '#f59e0b',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radar 3s linear infinite',
        'flash-hot': 'flashHot 1.5s ease-in-out infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        flashHot: {
          '0%, 100%': { borderColor: 'rgba(255, 51, 102, 0.4)', boxShadow: '0 0 15px rgba(255, 51, 102, 0.2)' },
          '50%': { borderColor: 'rgba(255, 51, 102, 1)', boxShadow: '0 0 25px rgba(255, 51, 102, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
