import { defineConfig } from 'vitest/config';

export default defineConfig({
  test:{maxWorkers:2},
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
