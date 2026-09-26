import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Para e2e, disable proxy e deixar Playwright mockar localmente
const useProxy = !process.env.PLAYWRIGHT_CHROMIUM

export default defineConfig({
  plugins: [react()],
  server: useProxy ? {
    proxy: {
      '/api/proxy': 'http://localhost:8000',
    },
  } : undefined,
  preview: useProxy ? {
    proxy: {
      '/api/proxy': 'http://localhost:8000',
    },
  } : undefined,
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    exclude: ['e2e/**', 'node_modules/**', '.worktrees/**', '.claude/**'],
    env: {
      NODE_ENV: 'test',
    },
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'api/proxy/**',
        'node_modules/**',
        'dist/**',
      ],
    },
  },
})
