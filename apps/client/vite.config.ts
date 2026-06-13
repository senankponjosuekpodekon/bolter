import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    origin: '*',  // Disable CSRF protection for ngrok
    allowedHosts: ['.ngrok-free.dev', '.ngrok.io', '.ngrok.app', 'localhost', 'all'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/notifications': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  // SPA fallback for production build
  // In dev, Vite handles it automatically
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-i18n': ['react-i18next', 'i18next'],
          'vendor-admin': ['react-admin', '@mui/material', '@mui/icons-material'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-socket': ['socket.io-client'],
        },
      },
    },
  },
})
