import type { Page, Route } from '@playwright/test'
import { atletasFixture } from '../fixtures/atletas'

/**
 * Intercepta as chamadas de rede disparadas pela Listagem de Jogadores
 * (lista de atletas via AuthProvider/listarTodosAtletas) e responde
 * com fixtures controlados no caminho /api/proxy/*.
 */
export async function mockJogadoresApi(page: Page): Promise<void> {
  // Fallback: qualquer chamada não prevista à API cai aqui como 404
  // controlado — nunca deve haver tentativa de rede real no e2e.
  await page.route('**/api/proxy/**', async (route: Route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'not mocked' }),
    })
  })

  // AuthProvider chama /contas/me ao montar a aplicação; 401 controlado
  // simula "visitante não autenticado" sem depender de sessão real.
  await page.route('**/api/proxy/contas/me', async (route: Route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Acesso não autorizado' }),
    })
  })

  // listarTodosAtletas pagina até receber menos que o tamanho máximo de
  // página — devolver o fixture completo na primeira página já encerra
  // o loop (fixture tem menos itens que o tamanho de página real).
  await page.route('**/api/proxy/atletas*', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(atletasFixture),
    })
  })
}
