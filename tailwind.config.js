/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark': '#111827',
        'light': '#F3F4F6',
        'primary': {
          DEFAULT: '#6D28D9', // A strong purple
          'light': '#8B5CF6',
          'dark': '#5B21B6',
        },
        'secondary': {
          DEFAULT: '#3B82F6', // A bright blue
          'light': '#60A5FA',
          'dark': '#2563EB',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      }
    },
  },
  plugins: [],
}