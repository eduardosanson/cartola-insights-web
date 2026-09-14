import type { Page } from '@playwright/test'
import { atletasFixture } from '../fixtures/atletas'

/**
 * Base da API usada pelo frontend em `vite dev` sem `.env` local
 * (ver `src/api/client.ts`). O e2e não sobe um backend real — toda
 * chamada de rede para essa origem é interceptada e respondida com
 * dados fixos, para eliminar dependência/flakiness de backend (issue
 * #6, RNF05).
 */
const API_BASE_URL = 'http://localhost:8000'

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
