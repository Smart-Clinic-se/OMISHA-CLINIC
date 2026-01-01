/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Ensures your toggle button works perfectly
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // 1. Map Colors to our Phase 1 Variables
      colors: {
        // Backgrounds (use as bg-main, bg-card-theme in standard tailwind if needed)
        main: 'var(--bg-primary)', 
        secondary: 'var(--bg-secondary)',
        card: 'var(--bg-card)',
        
        // Text Colors (use as text-main, text-secondary)
        'text-main': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        
        // Accents
        theme: 'var(--border-color)', // good for borders
        accent: 'var(--text-accent)',
      },
      // 2. Dynamic "Smart" Shadows
      dropShadow: {
        // This variable will be defined in CSS to change color based on theme
        'neon': '0 0 10px var(--neon-glow)', 
      },
      // 3. Animations
      animation: {
        'grid-flow': 'gridFlow 20s linear infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'scan': 'scan 5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'gridFlow': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(40px)' },
        },
        'pulseGlow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.2)' },
        },
        'scan': {
          '0%': { maskPosition: '-50% 0' },
          '100%': { maskPosition: '150% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}