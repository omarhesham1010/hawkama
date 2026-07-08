import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base is relative so the built module can be dropped into any LMS sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    cssMinify: false,
  },
  // Honor a PORT env var (used by the preview harness); fall back to Vite default.
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
});
