import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // FIX: Expose process.env.API_KEY to the client-side code, as required by the coding guidelines.
  // Vite replaces this with the value at build time.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})