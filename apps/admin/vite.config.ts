import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import type { PluginOption } from 'vite'

const plugins: PluginOption[] = [
  react() as unknown as PluginOption,
  viteCommonjs() as unknown as PluginOption,
]

export default defineConfig({
  plugins,
  define: {
    'process.env': JSON.stringify(process.env),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-is',
      '@mui/material',
      '@mui/icons-material',
      '@mui/utils',
      'react-admin',
    ],
    esbuildOptions: {
      mainFields: ['module', 'main'],
    },
  },
  build: {
    // reduce noisy warnings and add manual chunking to avoid a single large bundle
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('react-admin')) return 'vendor-react-admin';
            if (id.includes('@mui') || id.includes('material-ui')) return 'vendor-mui';
            if (id.includes('socket.io-client')) return 'vendor-socket';
            if (id.includes('ra-data-simple-rest')) return 'vendor-data';
            return 'vendor';
          }
        },
      },
    },
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/, /react-is/],
      transformMixedEsModules: true,
    },
  },
})
