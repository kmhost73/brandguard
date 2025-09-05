/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#101010',
        primary: '#6D28D9', // A strong indigo/purple for accents
        secondary: '#4C1D95', // A darker shade for hover states
        light: '#F9FAFB', // Light gray for dashboard/app background
        accent: '#2196F3', // Kept for potential secondary actions
        success: '#4CAF50',
        warning: '#FFC107',
        danger: '#F44336',
      }
    },
  },
  plugins: [],
}