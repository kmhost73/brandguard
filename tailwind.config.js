/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D47A1',
        secondary: '#1565C0',
        accent: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107',
        danger: '#F44336',
        light: '#F5F5F5',
        dark: '#212121',
      }
    },
  },
  plugins: [],
}
