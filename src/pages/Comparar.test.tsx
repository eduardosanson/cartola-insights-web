import { StrictMode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Comparar from './Comparar'
import * as atletasApi from '../api/atletas'
import * as percentisApi from '../api/percentis'
import * as raioXApi from '../api/raioX'
import * as perfilRiscoApi from '../api/perfilRisco'
import type { Atleta } from '../api/atletas'

function criarAtleta(overrides: Partial<Atleta> = {}): Atleta {
  return {
    id: 1,
    nome: 'Gabigol',
    posicao: 'ATA',
    clube_id: 5,
    clube_nome: 'Flamengo',
    preco_atual: 12.5,
    media_geral: 6.2,
    media_casa: 7.1,
    media_fora: 5.3,
    rodada_atual: 24,
    mando_rodada: 'casa',
    chance_pontuar_percentual: null,
    chance_pontuar_classificacao: null,
    media_basica: 4.1,
    overall_score: 69.3,
    ...overrides,
  }
}

const percentisPadrao = {
  atleta_id: 1,
  pontuacao_media: 80,
  participacao_gol: 91,
  desarme: 40,
  disciplina: 65,
  media_basica: 75,
  overall_score: 70.2,
}

const raioXPadrao = {
  atleta_id: 1,
  posicao: 'ATA',
  rodada: 24,
  mando: 'casa' as const,
  clube_adversario_id: 267,
  clube_adversario_nome: 'Vasco',
  media_no_mando: 7.15,
  pontos_cedidos_adversario: 4.89,
  participacao_pontuacao_time_media: 12.4,
  veredito: 'referencia_do_time' as const,
}

const perfilRiscoPadrao = {
  atleta_id: 1,
  risco_percentual: 70,
  classificacao: 'alto' as const,
  pontos_retorno_direto: 132,
  pontos_participacao: 56.5,
}

function renderComparar(query = '') {
  return render(
    <MemoryRouter initialEntries={[`/comparar${query}`]}>
      <Routes>
        <Route path="/comparar" element={<Comparar />} />
      </Routes>
    </MemoryRouter>,
  )
}

// Reproduz o ambiente real da app (src/main.tsx envolve <App /> em
// <StrictMode>), que dispara efeito→cleanup→efeito de novo no mount em
// dev — os testes acima com renderComparar() não pegam esse cenário
// porque MemoryRouter sozinho roda o efeito uma única vez.
function renderCompararStrictMode(query = '') {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[`/comparar${query}`]}>
        <Routes>
          <Route path="/comparar" element={<Comparar />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  )
}

describe('Comparar', () => {
  beforeEach(() => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([])
  })

  it('dispara as 4 chamadas de dados para os dois atletas em paralelo ao montar com ?a=&b=', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
      Promise.resolve(criarAtleta({ id, nome: id === 123 ? 'Atleta A' : 'Atleta B' })),
    )
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

    renderComparar('?a=123&b=456')

    await waitFor(() => expect(atletasApi.buscarAtleta).toHaveBeenCalledTimes(2))
    expect(atletasApi.buscarAtleta).toHaveBeenCalledWith(123)
    expect(atletasApi.buscarAtleta).toHaveBeenCalledWith(456)
    expect(percentisApi.buscarPercentisAtleta).toHaveBeenCalledWith(123)
    expect(percentisApi.buscarPercentisAtleta).toHaveBeenCalledWith(456)
    expect(raioXApi.buscarRaioXConfronto).toHaveBeenCalledWith(123)
    expect(raioXApi.buscarRaioXConfronto).toHaveBeenCalledWith(456)
    expect(perfilRiscoApi.buscarPerfilRiscoAtleta).toHaveBeenCalledWith(123)
    expect(perfilRiscoApi.buscarPerfilRiscoAtleta).toHaveBeenCalledWith(456)
    expect(percentisApi.buscarPercentisAtleta).toHaveBeenCalledTimes(2)
    expect(raioXApi.buscarRaioXConfronto).toHaveBeenCalledTimes(2)
    expect(perfilRiscoApi.buscarPerfilRiscoAtleta).toHaveBeenCalledTimes(2)
  })

  it('mostra "Carregando atleta…" para os dois atletas enquanto as 4 chamadas ainda não resolveram', () => {
    // promises que nunca resolvem — mantém o estado "carregando" travado
    // de propósito, pra observar o placeholder inicial de cache (o objeto
    // { status: 'carregando', ... } setado antes do Promise.allSettled).
    vi.spyOn(atletasApi, 'buscarAtleta').mockReturnValue(new Promise(() => {}))
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockReturnValue(new Promise(() => {}))
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockReturnValue(new Promise(() => {}))
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockReturnValue(new Promise(() => {}))

    renderComparar('?a=123&b=456')

    expect(screen.getAllByText('Carregando atleta…')).toHaveLength(2)
  })

  it('não duplica a busca quando "a" e "b" apontam pro mesmo id (dedupe dentro da mesma execução do efeito)', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockResolvedValue(criarAtleta({ id: 123, nome: 'Atleta A' }))
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

    renderComparar('?a=123&b=123')

    await waitFor(() => expect(atletasApi.buscarAtleta).toHaveBeenCalledTimes(1))
    expect(percentisApi.buscarPercentisAtleta).toHaveBeenCalledTimes(1)
  })

  it('isola a falha de um atleta: se os percentis do Atleta B rejeitam, o Atleta A renderiza completo e o Atleta B mostra "Dados insuficientes"', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
      Promise.resolve(criarAtleta({ id, nome: id === 123 ? 'Atleta A' : 'Atleta B' })),
    )
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockImplementation((id) =>
      id === 456
        ? Promise.reject(new Error('dados insuficientes — atleta com poucos jogos'))
        : Promise.resolve(percentisPadrao),
    )
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

    renderComparar('?a=123&b=456')

    expect(await screen.findByText('Atleta A')).toBeInTheDocument()
    expect(await screen.findByText('Atleta B')).toBeInTheDocument()
    expect(await screen.findByText('Dados insuficientes')).toBeInTheDocument()
    // não houve erro global nem travamento do Atleta A
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    // status ficou 'erro-parcial' de verdade (não "ok" por engano) — os
    // blocos analíticos (que exigem os dois atletas com status 'ok') não
    // devem aparecer quando um dos dois está incompleto.
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pentagono-jogador-a')).not.toBeInTheDocument()
  })

  it('isola a falha do atleta B quando só buscarAtleta rejeita (percentis, raio-x e perfil de risco ok)', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
      id === 456
        ? Promise.reject(new Error('atleta não encontrado'))
        : Promise.resolve(criarAtleta({ id, nome: 'Atleta A' })),
    )
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

    renderComparar('?a=123&b=456')

    expect(await screen.findByText('Atleta A')).toBeInTheDocument()
    expect(await screen.findByText('Dados insuficientes')).toBeInTheDocument()
  })

  it('isola a falha do atleta B quando só o raio-x rejeita (atleta, percentis e perfil de risco ok)', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
      Promise.resolve(criarAtleta({ id, nome: id === 123 ? 'Atleta A' : 'Atleta B' })),
    )
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockImplementation((id) =>
      id === 456 ? Promise.reject(new Error('raio-x indisponível')) : Promise.resolve(raioXPadrao),
    )
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

    renderComparar('?a=123&b=456')

    expect(await screen.findByText('Atleta B')).toBeInTheDocument()
    expect(await screen.findByText('Dados insuficientes')).toBeInTheDocument()
  })

  it('isola a falha do atleta B quando só o perfil de risco rejeita (atleta, percentis e raio-x ok)', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
      Promise.resolve(criarAtleta({ id, nome: id === 123 ? 'Atleta A' : 'Atleta B' })),
    )
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockImplementation((id) =>
      id === 456
        ? Promise.reject(new Error('perfil de risco indisponível'))
        : Promise.resolve(perfilRiscoPadrao),
    )

    renderComparar('?a=123&b=456')

    expect(await screen.findByText('Atleta B')).toBeInTheDocument()
    expect(await screen.findByText('Dados insuficientes')).toBeInTheDocument()
  })

  it('sem ?a=/?b= na URL, mostra os dois seletores AtletaAutocomplete vazios em vez de buscar', () => {
    vi.spyOn(atletasApi, 'buscarAtleta')
    vi.spyOn(percentisApi, 'buscarPercentisAtleta')
    vi.spyOn(raioXApi, 'buscarRaioXConfronto')
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta')

    renderComparar()

    expect(screen.getAllByRole('searchbox')).toHaveLength(2)
    expect(atletasApi.buscarAtleta).not.toHaveBeenCalled()
    expect(percentisApi.buscarPercentisAtleta).not.toHaveBeenCalled()
    expect(raioXApi.buscarRaioXConfronto).not.toHaveBeenCalled()
    expect(perfilRiscoApi.buscarPerfilRiscoAtleta).not.toHaveBeenCalled()
  })

  it('selecionar os dois atletas via seletores atualiza a URL e dispara a busca só quando os dois estão presentes', async () => {
    const zico = criarAtleta({ id: 789, nome: 'Zico' })
    const romario = criarAtleta({ id: 999, nome: 'Romario' })
    vi.mocked(atletasApi.listarTodosAtletas).mockResolvedValue([zico, romario])
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
      Promise.resolve(id === 789 ? zico : romario),
    )
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)
    const user = userEvent.setup()

    renderComparar()

    const [inputA] = screen.getAllByRole('searchbox')
    fireEvent.change(inputA, { target: { value: 'Zico' } })
    const opcaoZico = await screen.findByRole('option', { name: /zico/i }, { timeout: 1000 })
    await user.click(opcaoZico)

    // só o A foi selecionado até aqui — nenhuma busca deve ter disparado
    expect(atletasApi.buscarAtleta).not.toHaveBeenCalled()

    const [, inputB] = screen.getAllByRole('searchbox')
    fireEvent.change(inputB, { target: { value: 'Romario' } })
    const opcaoRomario = await screen.findByRole('option', { name: /romario/i }, { timeout: 1000 })
    await user.click(opcaoRomario)

    await waitFor(() => expect(atletasApi.buscarAtleta).toHaveBeenCalledWith(789))
    expect(atletasApi.buscarAtleta).toHaveBeenCalledWith(999)
  })

  it('trata "a" não numérico como slot vazio e mostra os seletores em vez de buscar', () => {
    vi.spyOn(atletasApi, 'buscarAtleta')

    renderComparar('?a=abc&b=456')

    expect(screen.getAllByRole('searchbox')).toHaveLength(2)
    expect(atletasApi.buscarAtleta).not.toHaveBeenCalled()
  })

  it('ignora respostas tardias após desmontar (sem setState pós-unmount)', async () => {
    let resolverAtleta: ((atleta: Atleta) => void) | undefined
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolverAtleta = resolve
        }),
    )
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

    const view = renderComparar('?a=123&b=456')
    view.unmount()
    resolverAtleta?.(criarAtleta({ id: 123, nome: 'Atleta A' }))

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(view.container).toBeEmptyDOMElement()
  })

  it('isola falhas de buscarAtleta, raioX e perfil de risco por atleta (não só percentis)', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
      id === 456
        ? Promise.reject(new Error('atleta não encontrado'))
        : Promise.resolve(criarAtleta({ id, nome: 'Atleta A' })),
    )
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockImplementation((id) =>
      id === 456 ? Promise.reject(new Error('raio-x indisponível')) : Promise.resolve(raioXPadrao),
    )
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockImplementation((id) =>
      id === 456
        ? Promise.reject(new Error('perfil de risco indisponível'))
        : Promise.resolve(perfilRiscoPadrao),
    )

    renderComparar('?a=123&b=456')

    expect(await screen.findByText('Atleta A')).toBeInTheDocument()
    expect(await screen.findByText('Dados insuficientes')).toBeInTheDocument()
    // atleta B falhou até em buscarAtleta — sem nome pra exibir, mas o
    // placeholder de dados insuficientes aparece e o Atleta A não é afetado
    expect(screen.getAllByText('Dados insuficientes')).toHaveLength(1)
  })

  it('sob StrictMode (efeito roda duas vezes no mount, como em produção), não trava em "Carregando" pra sempre', async () => {
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
      Promise.resolve(criarAtleta({ id, nome: id === 123 ? 'Atleta A' : 'Atleta B' })),
    )
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

    renderCompararStrictMode('?a=123&b=456')

    // Antes da correção, a 2ª execução do efeito (disparada pelo
    // StrictMode) pulava os ids já "marcados" pelo dedupe persistente,
    // e a 1ª execução tinha suas respostas descartadas pelo cleanup —
    // a tela ficava presa em "Carregando atleta…" pra sempre.
    // findAllByText (não findByText): com os blocos analíticos (Bloco D)
    // wireados, o nome de cada atleta aparece em mais de um lugar (h2,
    // legenda do pentágono, cabeçalho da tabela head-to-head, bloco de
    // risco) — o teste só precisa confirmar que os dois atletas carregaram,
    // não a contagem de repetições do nome.
    expect(await screen.findAllByText('Atleta A')).not.toHaveLength(0)
    expect(await screen.findAllByText('Atleta B')).not.toHaveLength(0)
    expect(screen.queryByText('Carregando atleta…')).not.toBeInTheDocument()
  })

  it('sob StrictMode, ignora a resposta tardia da 1ª execução do efeito quando ela chega depois da 2ª (guarda "ativo" por execução)', async () => {
    let resolverPrimeiraChamada: ((atleta: Atleta) => void) | undefined
    let numeroChamadaB = 0
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) => {
      if (id !== 456) return Promise.resolve(criarAtleta({ id, nome: 'Atleta A' }))
      numeroChamadaB += 1
      if (numeroChamadaB === 1) {
        // 1ª execução do efeito (cleanup roda antes dela resolver) —
        // fica pendente até resolvermos manualmente, de propósito.
        return new Promise((resolve) => {
          resolverPrimeiraChamada = resolve
        })
      }
      // 2ª execução do efeito (a que "vale", com ativo=true) resolve na hora
      return Promise.resolve(criarAtleta({ id: 456, nome: 'Atleta B Segunda Chamada' }))
    })
    vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
    vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

    renderCompararStrictMode('?a=123&b=456')

    // o nome aparece em mais de um lugar (h2, legenda do pentágono, tabela
    // head-to-head, bloco de risco) — ver nota no teste de StrictMode acima
    expect(await screen.findAllByText('Atleta B Segunda Chamada')).not.toHaveLength(0)

    // a resposta da 1ª execução (já desativada pelo cleanup) chega tarde
    resolverPrimeiraChamada?.(criarAtleta({ id: 456, nome: 'Atleta B Primeira Chamada (obsoleta)' }))
    await new Promise((resolve) => setTimeout(resolve, 0))

    // não deve reverter o nome já atualizado pela 2ª execução
    expect(screen.queryByText('Atleta B Primeira Chamada (obsoleta)')).not.toBeInTheDocument()
    expect(screen.getAllByText('Atleta B Segunda Chamada')).not.toHaveLength(0)
  })

  describe('blocos analíticos (Bloco D)', () => {
    it('renderiza o Pentágono Dual quando os dois atletas carregam com sucesso e são da mesma categoria', async () => {
      vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
        Promise.resolve(criarAtleta({ id, nome: id === 123 ? 'Atleta A' : 'Atleta B' })),
      )
      vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
      vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
      vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

      renderComparar('?a=123&b=456')

      expect(await screen.findByTestId('pentagono-jogador-a')).toBeInTheDocument()
      expect(screen.getByTestId('pentagono-jogador-b')).toBeInTheDocument()
      expect(screen.queryByText(/posições não comparáveis/i)).not.toBeInTheDocument()
      // com os dois atletas 'ok', o placeholder "Dados insuficientes" não
      // deve aparecer pra nenhum dos dois.
      expect(screen.queryByText('Dados insuficientes')).not.toBeInTheDocument()
    })

    it('cai para dois pentágonos individuais lado a lado + aviso quando as posições são incompatíveis (GOL vs. linha, CA03)', async () => {
      const percentisGol = {
        atleta_id: 456,
        pontuacao_media: 88,
        defesas: 80,
        solidez_sg: 70,
        disciplina: 90,
        media_basica: 60,
      }
      vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
        Promise.resolve(
          criarAtleta({
            id,
            nome: id === 123 ? 'Atleta A' : 'Atleta B',
            posicao: id === 123 ? 'ATA' : 'GOL',
          }),
        ),
      )
      vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockImplementation((id) =>
        Promise.resolve(id === 456 ? percentisGol : percentisPadrao),
      )
      vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
      vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

      renderComparar('?a=123&b=456')

      expect(await screen.findByText(/posições não comparáveis/i)).toBeInTheDocument()
      expect(screen.getAllByTestId('pentagono-jogador')).toHaveLength(2)
      expect(screen.queryByTestId('pentagono-jogador-a')).not.toBeInTheDocument()
    })

    it('tabela Head-to-Head marca com badge o atleta com maior valor em cada métrica (brutos.*)', async () => {
      const percentisComBrutosA = {
        atleta_id: 123,
        pontuacao_media: 90,
        participacao_gol: 80,
        desarme: 40,
        disciplina: 70,
        media_basica: 75,
        brutos: {
          pontuacao_media: 9.0,
          participacao_gol: 0.7,
          desarme: 1.2,
          disciplina: 0.9,
          media_basica: 5.5,
        },
      }
      const percentisComBrutosB = {
        atleta_id: 456,
        pontuacao_media: 60,
        participacao_gol: 55,
        desarme: 70,
        disciplina: 50,
        media_basica: 60,
        brutos: {
          pontuacao_media: 6.5,
          participacao_gol: 0.5,
          desarme: 2.0,
          disciplina: 0.6,
          media_basica: 4.0,
        },
      }
      vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
        Promise.resolve(criarAtleta({ id, nome: id === 123 ? 'Atleta A' : 'Atleta B' })),
      )
      vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockImplementation((id) =>
        Promise.resolve(id === 123 ? percentisComBrutosA : percentisComBrutosB),
      )
      vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
      vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

      renderComparar('?a=123&b=456')

      const tabela = within(await screen.findByRole('table'))
      const linhaPoderDeFogo = tabela.getByText('Poder de Fogo').closest('tr')!
      const linhaCombate = tabela.getByText('Combate').closest('tr')!

      // "Poder de Fogo": Atleta A tem bruto maior (9,0 > 6,5) — badge no A
      expect(within(linhaPoderDeFogo).getAllByText('Maior')).toHaveLength(1)
      const celulasA = within(linhaPoderDeFogo).getAllByRole('cell')[1]
      expect(within(celulasA).queryByText('Maior')).toBeInTheDocument()

      // "Combate": Atleta B tem bruto maior (2,0 > 1,2) — badge no B
      expect(within(linhaCombate).getAllByText('Maior')).toHaveLength(1)
      const celulasB = within(linhaCombate).getAllByRole('cell')[2]
      expect(within(celulasB).queryByText('Maior')).toBeInTheDocument()
    })

    it('bloco Raio-X mostra o RaioXConfronto (mando, adversário, veredito) dos dois atletas lado a lado', async () => {
      vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
        Promise.resolve(criarAtleta({ id, nome: id === 123 ? 'Atleta A' : 'Atleta B' })),
      )
      vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
      vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockImplementation((id) =>
        Promise.resolve({
          ...raioXPadrao,
          atleta_id: id,
          clube_adversario_nome: id === 123 ? 'Vasco' : 'Botafogo',
        }),
      )
      vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockResolvedValue(perfilRiscoPadrao)

      renderComparar('?a=123&b=456')

      expect(await screen.findByText('Vasco cede em média')).toBeInTheDocument()
      expect(screen.getByText('Botafogo cede em média')).toBeInTheDocument()
      expect(screen.getAllByText('Referência do time')).toHaveLength(2)
      expect(screen.getAllByText('Média em casa')).toHaveLength(2)
    })

    it('bloco Perfil de Risco mostra a classificação e a distribuição retorno-direto/participação dos dois atletas lado a lado', async () => {
      vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation((id) =>
        Promise.resolve(criarAtleta({ id, nome: id === 123 ? 'Atleta A' : 'Atleta B' })),
      )
      vi.spyOn(percentisApi, 'buscarPercentisAtleta').mockResolvedValue(percentisPadrao)
      vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockResolvedValue(raioXPadrao)
      vi.spyOn(perfilRiscoApi, 'buscarPerfilRiscoAtleta').mockImplementation((id) =>
        Promise.resolve({
          ...perfilRiscoPadrao,
          atleta_id: id,
          classificacao: id === 123 ? 'alto' : 'baixo',
          pontos_retorno_direto: id === 123 ? 132 : 40,
          pontos_participacao: id === 123 ? 56.5 : 20,
        }),
      )

      renderComparar('?a=123&b=456')

      expect(await screen.findByText(/risco alto/i)).toBeInTheDocument()
      expect(screen.getByText(/risco baixo/i)).toBeInTheDocument()
      expect(screen.getAllByText('Retorno direto')).toHaveLength(2)
      expect(screen.getAllByText('Participação')).toHaveLength(2)
      expect(screen.getByText('132')).toBeInTheDocument()
      expect(screen.getByText('56,5')).toBeInTheDocument()
    })
  })
})
