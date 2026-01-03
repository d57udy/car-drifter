import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/car-drifter/',  // GitHub Pages base path
  publicDir: 'assets',
  build: {
    outDir: 'dist',
  },
  server: {
    host: true,
    port: 3000,
  },
});
