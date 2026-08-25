import { StrictMode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
    expect(await screen.findByText('Atleta A')).toBeInTheDocument()
    expect(await screen.findByText('Atleta B')).toBeInTheDocument()
    expect(screen.queryByText('Carregando atleta…')).not.toBeInTheDocument()
  })
})
