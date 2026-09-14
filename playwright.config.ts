import { defineConfig, devices } from '@playwright/test'
import { E2E_API_BASE_URL } from './e2e/support/env'

/**
 * Infraestrutura inicial de regressão visual/estrutural (issue #6):
 * cobre apenas a Listagem de Jogadores, em desktop e mobile, focada em
 * detectar erro de execução, erro de página, console crítico ou
 * renderização básica quebrada — sem baseline versionada nem
 * comparação pixel a pixel (fica para uma etapa posterior).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    // Nunca reaproveitar um servidor já rodando na porta: um `vite dev`
    // que o desenvolvedor já tenha de pé (outro terminal, outro projeto)
    // pode ter subido com um VITE_API_BASE_URL diferente do `env` abaixo
    // — reuso ignoraria esse `env` e o e2e voltaria a vazar para a
    // origem real (mesma falha corrigida no commit d510927, agora
    // também coberta para o caminho de servidor reaproveitado).
    reuseExistingServer: false,
    timeout: 60_000,
    // Força a origem da API que o app usa (src/api/client.ts) para a
    // mesma que os mocks interceptam (e2e/support/mockApi.ts) — sem
    // isso, um .env/.env.local local com VITE_API_BASE_URL diferente
    // faria o e2e vazar para uma API real, quebrando reprodutibilidade
    // (RNF04) e isolamento de dados (RNF05).
    env: { VITE_API_BASE_URL: E2E_API_BASE_URL },
  },
})
