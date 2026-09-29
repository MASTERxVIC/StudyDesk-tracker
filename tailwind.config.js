/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#faf4f6', // page background — pale dusty rose
          100: '#f6e9ee',
          200: '#f0dbe3', // soft pink pill / surfaces
          300: '#e3c2cd',
          400: '#c99bab',
          500: '#b98a9c',
        },
        rosey: {
          DEFAULT: '#a8566e', // muted dusty-rose accent
          dark: '#8f4660',
          soft: '#c08095',
        },
        ink: '#2b2327', // warm near-black text
      },
      fontFamily: {
        display: ['var(--font-righteous)', 'cursive'],
        sans: ['var(--font-space-grotesk)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
