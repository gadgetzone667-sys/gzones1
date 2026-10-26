import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  cacheDir: path.resolve(os.tmpdir(), 'gadgetzone_vite_cache'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      ignored: ['**/*.mp4', '**/*.jpeg', '**/*.jpg', '**/*.png', '**/*.webp', '**/*.ico', '**/server/**', '**/.git/**']
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  }
});
