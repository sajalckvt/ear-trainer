import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages subpath: https://<user>.github.io/ear-trainer/
// Set via VITE_BASE env var in the deploy workflow, default to '/' for local dev.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/',
  build: {
    target: 'es2020',
    // The soundfont JSON is 2.76MB; Vite warns above 500KB.
    // We serve it from /public so it's not bundled, but raising the limit
    // silences noisy warnings about other large assets if any appear later.
    chunkSizeWarningLimit: 1024,
  },
});
