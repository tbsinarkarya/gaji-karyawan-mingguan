/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#4F46E5',   // indigo-600
        'brand-secondary': '#10B981', // emerald-500
      },
    },
  },
  plugins: [],
}
