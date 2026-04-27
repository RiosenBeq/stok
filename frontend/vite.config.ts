import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In Claude Code on the web the backend is mounted at /_/backend (see
// .claude/settings.json). Locally we still proxy plain /api for convenience.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/_/backend': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/_\/backend/, ''),
      },
    },
  },
});
