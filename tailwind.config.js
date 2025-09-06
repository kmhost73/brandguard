/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#1A202C', // Deep charcoal for dark mode background
        'slate': {
          DEFAULT: '#4A5568', // Primary slate blue
          'light': '#718096',
          'dark': '#2D3748',
        },
        'accent': {
          DEFAULT: '#38B2AC', // Vibrant teal for accents
          'light': '#4FD1C5',
          'dark': '#319795',
        },
        light: '#F7FAFC', // Very light gray for light mode background
        success: '#38A169',
        warning: '#D69E2E',
        danger: '#E53E3E',
      }
    },
  },
  plugins: [],
}