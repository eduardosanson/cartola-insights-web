import type { Page } from '@playwright/test'
import { atletasFixture } from '../fixtures/atletas'
import { E2E_API_BASE_URL as API_BASE_URL } from './env'

// A origem interceptada aqui é forçada no processo do `vite dev` por
// `playwright.config.ts` (webServer.env), então permanece esta mesma
// origem independentemente de qualquer `.env`/`.env.local` local do
// desenvolvedor (ver `e2e/support/env.ts`).

/**
 * Intercepta as chamadas de rede disparadas pela Listagem de Jogadores
 * (lista de atletas via `AuthProvider`/`listarTodosAtletas`) e responde
 * com um fixture controlado. Registrado antes de qualquer navegação.
 */
export async function mockJogadoresApi(page: Page): Promise<void> {
  // Fallback: qualquer chamada não prevista à API cai aqui como 404
  // controlado — nunca deve haver tentativa de rede real no e2e.
  await page.route(`${API_BASE_URL}/**`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'not mocked' }),
    })
  })

  // AuthProvider chama /contas/me ao montar a aplicação; 401 controlado
  // simula "visitante não autenticado" sem depender de sessão real.
  await page.route(`${API_BASE_URL}/contas/me`, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Acesso não autorizado' }),
    })
  })

  // listarTodosAtletas pagina até receber menos que o tamanho máximo de
  // página — devolver o fixture completo na primeira página já encerra
  // o loop (fixture tem menos itens que o tamanho de página real).
  await page.route(`${API_BASE_URL}/atletas**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(atletasFixture),
    })
  })
}
