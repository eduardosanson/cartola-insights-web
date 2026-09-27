import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const proxyConfig = {
  target: process.env.BACKEND_ORIGIN || 'http://localhost:8000',
  changeOrigin: true,
  rewrite: (path: string) => path.replace(/^\/api\/proxy/, ''),
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/proxy': proxyConfig,
    },
  },
  preview: {
    proxy: {
      '/api/proxy': proxyConfig,
    },
  },
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
