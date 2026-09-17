import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    // e2e/ roda sob o test runner do Playwright (playwright.config.ts),
    // não sob o Vitest — excluir para evitar conflito entre os dois
    // `test`/`describe` globais (issue #6).
    exclude: ['e2e/**', 'node_modules/**'],
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
        'node_modules/**',
        'dist/**',
      ],
    },
  },
})
