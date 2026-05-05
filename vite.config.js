import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const HEROKU_BACKEND = 'https://seun-trading-bot-api-2026-28f6d6f40e1b.herokuapp.com'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      // Proxy /api/* and /udf/* and /health to the Heroku backend
      // This runs server-side so CORS headers are not required
      '/api': {
        target: HEROKU_BACKEND,
        changeOrigin: true,
        secure: true
      },
      '/udf': {
        target: HEROKU_BACKEND,
        changeOrigin: true,
        secure: true
      },
      '/health': {
        target: HEROKU_BACKEND,
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})