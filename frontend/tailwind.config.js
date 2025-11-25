/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'grid-flow': 'gridFlow 20s linear infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
      },
      keyframes: {
        'gridFlow': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(40px)' },
        },
        'pulseGlow': {
            '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
            '50%': { opacity: '0.8', transform: 'scale(1.2)' },
        }
      },
      dropShadow: {
        'neon': '0 0 5px rgba(244, 63, 94, 1)',
      }
    },
  },
  plugins: [],
}