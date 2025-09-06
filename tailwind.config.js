/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark': '#1A202C',
        'light': '#F7FAFC',
        'primary': {
          DEFAULT: '#38B2AC', // Teal
          'light': '#4FD1C5',
          'dark': '#319795',
        },
        'secondary': {
          DEFAULT: '#4A5568', // Slate
          'light': '#718096',
          'dark': '#2D3748',
        },
        success: '#38A169', // Green
        warning: '#D69E2E', // Yellow/Gold
        danger: '#E53E3E',  // Red
      }
    },
  },
  plugins: [],
}