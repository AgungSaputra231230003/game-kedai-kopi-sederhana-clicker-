/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#e4d4cf',
          300: '#d0b4ab',
          400: '#b78b7e',
          500: '#9f6959',
          600: '#885042',
          700: '#713e33',
          800: '#5e342c',
          900: '#4e2d27',
          950: '#2a1612',
        },
        amberGold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      animation: {
        'bounce-short': 'bounce 0.3s ease-in-out 1',
        'float-up': 'floatUp 1s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s infinite',
        'steam': 'steam 2s infinite ease-in-out',
      },
      keyframes: {
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-60px) scale(1.2)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(217, 119, 6, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(217, 119, 6, 0.8)' },
        },
        steam: {
          '0%': { transform: 'translateY(0) scaleX(1)', opacity: '0.2' },
          '50%': { transform: 'translateY(-10px) scaleX(1.2)', opacity: '0.7' },
          '100%': { transform: 'translateY(-20px) scaleX(0.8)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
