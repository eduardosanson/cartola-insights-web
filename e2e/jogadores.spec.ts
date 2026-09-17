import { expect, test } from '@playwright/test'
import { atletasFixture } from './fixtures/atletas'
import { mockJogadoresApi } from './support/mockApi'

/**
 * Cobertura inicial de regressão visual/estrutural (issue #6): garante
 * que a Listagem de Jogadores carrega sem erro crítico e renderiza sua
 * UI principal, em desktop e mobile (viewports configurados em
 * `playwright.config.ts`). Sem baseline de screenshot nem comparação
 * pixel a pixel — isso fica para uma etapa posterior (RNF02/RNF03).
 */
test.describe('Listagem de Jogadores', () => {
  test('carrega sem erro crítico e renderiza a tabela principal', async ({ page }) => {
    const errosDeConsole: string[] = []
    const errosDePagina: string[] = []

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return
      // AuthProvider sempre sonda /contas/me ao montar; um visitante
      // anônimo recebe 401 (mockado) e o browser loga isso como
      // "Failed to load resource" — ruído esperado, não erro crítico.
      // Qualquer outro erro de console (inclusive 4xx/5xx em outro
      // recurso) continua contando como crítico.
      const url = msg.location().url
      const eSondaDeAuthEsperada = url.includes('/contas/me') && msg.text().includes('401')
      if (!eSondaDeAuthEsperada) errosDeConsole.push(`${msg.text()} (${url})`)
    })
    page.on('pageerror', (err) => {
      errosDePagina.push(err.message)
    })

    await mockJogadoresApi(page)

    const response = await page.goto('/jogadores')
    expect(response?.ok(), 'a página deve carregar com status 2xx').toBeTruthy()

    // UI principal: cabeçalho da tabela e uma linha por atleta do fixture.
    await expect(page.getByRole('columnheader', { name: 'Nome' })).toBeVisible()
    const linhas = page.getByRole('row').filter({ hasNotText: 'Nome' })
    await expect(linhas).toHaveCount(atletasFixture.length)
    await expect(page.getByText(atletasFixture[0].nome)).toBeVisible()
    await expect(page.getByText(atletasFixture[0].clube_nome)).toBeVisible()

    // Screenshot capturado não pode estar vazio/corrompido — sem baseline,
    // a checagem é um piso de tamanho de arquivo (renderização quebrada
    // tende a gerar uma página quase em branco e um PNG muito menor).
    const screenshot = await page.screenshot({ fullPage: true })
    expect(screenshot.byteLength).toBeGreaterThan(5000)

    expect(errosDePagina, `erros de página: ${errosDePagina.join('; ')}`).toHaveLength(0)
    expect(errosDeConsole, `erros de console: ${errosDeConsole.join('; ')}`).toHaveLength(0)
  })
})
