import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'path';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@zeropay/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['@meshsdk/core', '@meshsdk/react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Cardano / Mesh SDK — largest, split first
          if (
            id.includes('@meshsdk') ||
            id.includes('@emurgo') ||
            id.includes('@lucid-evolution') ||
            id.includes('cardano')
          ) {
            return 'vendor-cardano';
          }
          // Firebase
          if (id.includes('firebase') || id.includes('@firebase')) {
            return 'vendor-firebase';
          }
          // QR scanner
          if (id.includes('qr-scanner') || id.includes('jsQR')) {
            return 'vendor-qr';
          }
          // React core
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor-react';
          }
          // TanStack Query + UI utilities
          if (
            id.includes('@tanstack') ||
            id.includes('lucide-react') ||
            id.includes('zustand')
          ) {
            return 'vendor-ui';
          }
        },
      },
    },
  },
});
