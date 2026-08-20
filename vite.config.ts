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
    // The repo root has accumulated many scratch/build/export folders
    // (dist-course*, tmp-*, scorm-packages, governance-module, etc.) that
    // are not part of the app source. Left unignored, chokidar recursively
    // watches all of them too, which on Windows made cold dev-server starts
    // take minutes (thousands of extra files to stat/scan) before the very
    // first request could resolve. None of these affect app behavior, so
    // they're excluded from the watcher only -- nothing else changes.
    watch: {
      ignored: [
        '**/dist/**',
        '**/dist-course*/**',
        '**/dist-sample/**',
        '**/tmp/**',
        '**/tmp-*/**',
        '**/scorm-packages/**',
        '**/governance-module/**',
        '**/nasser-assets/**',
        '**/.agents/**',
        '**/.elevenlabs-pending/**',
      ],
    },
  },
});
