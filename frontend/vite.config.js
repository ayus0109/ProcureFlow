import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Forwards /api/* to the Express server, so the frontend never needs to
    // know the backend port and CORS never comes up in the browser.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
