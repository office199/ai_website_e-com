/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#20211f',
        cream: '#f5f2eb',
        paper: '#faf9f5',
        line: '#dcd8ce',
        rust: '#c85b3c',
        green: '#384b3d',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        display: ['Playfair Display', 'serif'],
        icon: ['Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,.18)',
        modal: '0 20px 50px rgba(0,0,0,.15)',
      },
      gridTemplateColumns: {
        hero: '48% 52%',
        story: '53% 47%',
        dash: '29% 71%',
        admin: '230px 1fr',
        footer: '1.3fr 2fr',
        overview: '1.6fr 1fr',
      },
    },
  },
  plugins: [],
};
