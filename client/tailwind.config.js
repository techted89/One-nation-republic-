
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#001f3f',
          dark: '#001226',
        },
        gold: {
          DEFAULT: '#FFD700',
          light: '#FFE44D',
        }
      }
    },
  },
  plugins: [],
}
