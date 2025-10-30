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
  server: {
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
    sourcemap: true,
    commonjsOptions: {
      include: [/node_modules/, /react-is/],
      transformMixedEsModules: true,
    },
  },
})
