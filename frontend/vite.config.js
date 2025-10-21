import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true
    },
    // Allow Cloudflare Tunnel domains
    allowedHosts: [
      '.trycloudflare.com',
      'localhost',
      '127.0.0.1'
    ],
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
