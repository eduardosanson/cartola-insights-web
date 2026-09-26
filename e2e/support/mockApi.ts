import type { Page, Route } from '@playwright/test'
import { atletasFixture } from '../fixtures/atletas'

/**
 * Mock para e2e: intercept requests na origem local (5173).
 * Proxy do Vite está desabilitado em e2e, então mock intercepta direto.
 */
export async function mockJogadoresApi(page: Page): Promise<void> {
  await page.route('**/api/proxy/contas/me', async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Acesso não autorizado' }),
    })
  })

  await page.route('**/api/proxy/atletas*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(atletasFixture),
    })
  })

  await page.route('**/*', async (route: Route) => {
    if (!route.request().url().includes('/assets/')) {
      await route.continue()
    }
  })
}
