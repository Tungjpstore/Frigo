import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/web'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@packages': path.resolve(__dirname, './packages'),
      '@frigo/domain': path.resolve(__dirname, './packages/domain/src/index.ts'),
      '@frigo/recipes': path.resolve(__dirname, './packages/recipes/src/index.ts'),
      '@frigo/ai': path.resolve(__dirname, './packages/ai/src/index.ts'),
      '@frigo/db': path.resolve(__dirname, './packages/db/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://127.0.0.1:8787',
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: 'dist/client',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query', 'zustand'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
