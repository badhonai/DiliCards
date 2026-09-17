import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' = the built site works from ANY path (domain root, subfolder, Netlify, GitHub Pages…)
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', assetsDir: 'assets' }
});
