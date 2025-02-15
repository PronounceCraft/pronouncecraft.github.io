import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        howtouse: resolve(__dirname, 'templates/howtouse.html'),
        privacy: resolve(__dirname, 'templates/privacy.html')
      }
    }
  }
});