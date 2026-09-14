/**
 * Origem da API usada pelo e2e (issue #6). Compartilhada entre
 * `playwright.config.ts` (que força essa origem via `VITE_API_BASE_URL`
 * no `webServer`, sobrescrevendo qualquer `.env`/`.env.local` que o
 * desenvolvedor tenha localmente) e `e2e/support/mockApi.ts` (que
 * intercepta exatamente essa origem) — evita que os dois arquivos
 * divirjam e que o e2e escape do mock para uma API real (P2 do review
 * automatizado na PR #26).
 */
export const E2E_API_BASE_URL = 'http://localhost:8000'
