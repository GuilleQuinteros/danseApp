/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#edf8f7',
          100: '#c2ebe6',
          200: '#8dd4ca',
          300: '#3dcfc0',
          400: '#2aada0',
          500: '#1d7a70',
          600: '#1a7a72',
          700: '#0d3d38',
          800: '#0a3d38',
          900: '#072e2a'
        },
        sage: {
          50: '#f0f5f2',
          100: '#d8ebe3',
          200: '#b0d4c4'
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif']
      }
    },
  },
  plugins: [],
}
