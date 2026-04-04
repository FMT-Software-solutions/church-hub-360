import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // Use relative paths for Electron renderer
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'stream': 'stream-browserify',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react', 'xlsx-js-style', 'xlsx'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: []
    }
  },
});