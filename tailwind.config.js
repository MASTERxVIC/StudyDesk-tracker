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
        // Sky-blue theme (token names blush/rosey kept — saare pages auto-convert)
        blush: {
          50: '#eef7fd', // page background — pale sky mist
          100: '#dff0fa',
          200: '#c9e8f9', // soft blue pill / surfaces
          300: '#9cd3f0',
          400: '#6fc3ee',
          500: '#4aa8dc',
        },
        rosey: {
          DEFAULT: '#1b9bd8', // sky-blue accent
          dark: '#0e7cb8',
          soft: '#6fc3ee',
        },
        ink: '#123a5c', // deep navy text
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
