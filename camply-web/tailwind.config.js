/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Sans', 'sans-serif'],
      },
      colors: {
        primary: '#1976d2',
        secondary: '#f5f5f5',
      },
    },
  },
  plugins: [],
} 