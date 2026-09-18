import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' = the built site works from ANY path (domain root, subfolder, Netlify, GitHub Pages…)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  build: { outDir: 'dist', assetsDir: 'assets' }
});
