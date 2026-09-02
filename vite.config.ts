import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Single chunk — ไม่ split เพื่อ Capacitor WebView
        manualChunks: undefined,
        inlineDynamicImports: true,
      },
    },
  },
  // Capacitor ใช้ relative path
  base: './',
});
