/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './screens/**/*.{js,jsx,ts,tsx}', './providers/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#259df4',
          dark: '#06b6d4',
        },
        background: {
          light: '#f5f7f8',
          dark: '#101a22',
        },
        panel: {
          dark: '#334155',
        },
        landing: '#121212',
        surface: {
          dark: '#1e293b',
          card: '#1a1a1a',
        },
        border: {
          dark: '#333333',
        },
      },
      fontFamily: {
        display: ['Inter', 'System'],
      },
    },
  },
  plugins: [],
};
