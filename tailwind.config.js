/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
