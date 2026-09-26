import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import * as atletasApi from '../api/atletas'
import * as api from '../api/otimizador'
import * as raioXApi from '../api/raioX'
import * as sincronizacaoApi from '../api/sincronizacao'
import Escalador from './Escalador'

const esquemas = {
  '4-3-3': { GOL: 1, ZAG: 2, LAT: 2, MEI: 3, ATA: 3, TEC: 1 },
  '3-4-3': { GOL: 1, ZAG: 3, LAT: 0, MEI: 4, ATA: 3, TEC: 1 },
} as unknown as api.EsquemasDisponiveis

const escalacao: api.EscalacaoOtima = {
  titulares: [
    { atleta_id: 1, posicao: 'GOL', preco: 8, pontuacao_esperada: 5 },
    { atleta_id: 2, posicao: 'ZAG', preco: 7, pontuacao_esperada: 4 },
    { atleta_id: 3, posicao: 'LAT', preco: 7, pontuacao_esperada: 4 },
    { atleta_id: 4, posicao: 'MEI', preco: 7, pontuacao_esperada: 4 },
    { atleta_id: 5, posicao: 'ATA', preco: 7, pontuacao_esperada: 4 },
  ],
  tecnico: { atleta_id: 12, preco: 4 },
  custo_total: 40,
  pontuacao_esperada_total: 45,
  esquema: '4-3-3',
  modo: 'classica',
}

function renderizar() {
  return render(
    <MemoryRouter>
      <Escalador />
    </MemoryRouter>,
  )
}

function renderizarStrict() {
  return render(
    <StrictMode>
      <MemoryRouter>
        <Escalador />
      </MemoryRouter>
    </StrictMode>,
  )
}

describe('Escalador', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(api, 'buscarEsquemas').mockResolvedValue(esquemas)
    vi.spyOn(api, 'montarEscalacao').mockResolvedValue(escalacao)
    vi.spyOn(atletasApi, 'buscarAtleta').mockImplementation(async (id) => ({
      id,
      nome: `Nome ${id}`,
      posicao: id === 12 ? 'TEC' : 'GOL',
      clube_nome: `Clube ${id}`,
    }) as atletasApi.Atleta)
    vi.spyOn(raioXApi, 'buscarRaioXConfronto').mockImplementation(async (id) => ({
      atleta_id: id,
      mando: 'casa',
      clube_adversario_nome: `Adversário ${id}`,
      media_no_mando: 6.5,
    }) as raioXApi.RaioXConfronto)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mantém o formulário utilizável quando o status de sincronização falha', async () => {
    vi.spyOn(sincronizacaoApi, 'fetchSyncStatus').mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    renderizar()

    expect(await screen.findByText(/atualização indisponível/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))
    expect(await screen.findByRole('heading', { name: /escalação sugerida/i })).toBeInTheDocument()
  })

  it('exibe rodada e horário da última sincronização', async () => {
    vi.spyOn(sincronizacaoApi, 'fetchSyncStatus').mockResolvedValue({
      round: 24,
      timestamp: '2026-09-26T15:30:00Z',
    })
    renderizar()

    expect(await screen.findByText(/rodada 24 • sincronizado em/i)).toBeInTheDocument()
  })


  it('carrega formações e envia os parâmetros escolhidos', async () => {
    const user = userEvent.setup()
    renderizar()

    expect(await screen.findByText(/1 GOL · 2 ZAG · 2 LAT · 3 MEI · 3 ATA · 1 TEC/)).toBeInTheDocument()
    expect(screen.getByLabelText(/esquema/i)).not.toBeDisabled()
    await user.clear(screen.getByLabelText(/orçamento/i))
    await user.type(screen.getByLabelText(/orçamento/i), '120')
    await user.selectOptions(screen.getByLabelText(/modo/i), 'tiro_curto')
    expect(screen.getByText(/maior teto estimado/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))

    expect(api.montarEscalacao).toHaveBeenCalledWith({
      orcamento: 120,
      esquema: '4-3-3',
      modo: 'tiro_curto',
    })
    expect(await screen.findByRole('heading', { name: /escalação sugerida/i })).toBeInTheDocument()
    expect(screen.getByText(/C\$ 40,00 de C\$ 120,00/)).toBeInTheDocument()
    expect(screen.getByText(/— C\$ 80,00 sobrando/)).toBeInTheDocument()
    expect(screen.getByText('Pontuação esperada')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.queryByText('Total do objetivo')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^nome 1\b/i })).toHaveAttribute(
      'href',
      '/jogadores/1',
    )
  })

  it('traduz inviabilidade em orientação acionável sem escalação parcial', async () => {
    vi.mocked(api.montarEscalacao).mockRejectedValue(
      new api.EscalacaoInviavelError('não há escalação viável'),
    )
    const user = userEvent.setup()
    renderizar()

    await screen.findByRole('button', { name: /montar escalação ótima/i })
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Aumente o orçamento ou escolha outro esquema',
    )
    expect(screen.queryByRole('heading', { name: /escalação sugerida/i })).not.toBeInTheDocument()
  })

  it('oferece o modo Overall multifator', async () => {
    const user = userEvent.setup()
    renderizar()

    await screen.findByRole('button', { name: /montar escalação ótima/i })
    await user.selectOptions(screen.getByLabelText(/modo/i), 'overall')
    expect(screen.getByText(/overall, chance de pontuar, confronto e piso/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))

    expect(api.montarEscalacao).toHaveBeenCalledWith(
      expect.objectContaining({ modo: 'overall' }),
    )
  })

  it('mantém o formulário disponível quando os esquemas falham', async () => {
    vi.mocked(api.buscarEsquemas).mockRejectedValue(new Error('Serviço indisponível'))
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço indisponível')
    expect(screen.getByLabelText(/orçamento/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/esquema/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /montar escalação ótima/i })).toBeDisabled()
  })

  it('exibe nome e descrição de cada modo de otimização', async () => {
    const user = userEvent.setup()
    renderizar()
    await screen.findByRole('button', { name: /montar escalação ótima/i })

    expect(screen.getByRole('option', { name: 'Liga Clássica' })).toBeInTheDocument()
    expect(screen.getByText('Prioriza atletas com maior piso de pontuação.')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/modo/i), 'tiro_curto')
    expect(screen.getByRole('option', { name: 'Tiro Curto' })).toBeInTheDocument()
    expect(screen.getByText('Prioriza atletas com maior teto estimado.')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/modo/i), 'patrimonio')
    expect(screen.getByRole('option', { name: 'Patrimônio' })).toBeInTheDocument()
    expect(
      screen.getByText('Prioriza atletas com maior margem histórica de valorização.'),
    ).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText(/modo/i), 'overall')
    expect(screen.getByRole('option', { name: 'Overall equilibrado' })).toBeInTheDocument()
    expect(
      screen.getByText('Combina overall, chance de pontuar, confronto e piso básico.'),
    ).toBeInTheDocument()
  })

  it('omite posições com quantidade zero no resumo da formação', async () => {
    const user = userEvent.setup()
    renderizar()
    await screen.findByText(/1 GOL/)

    await user.selectOptions(screen.getByLabelText(/esquema/i), '3-4-3')

    expect(
      await screen.findByText('Formação: 1 GOL · 3 ZAG · 4 MEI · 3 ATA · 1 TEC'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/LAT/)).not.toBeInTheDocument()
  })

  it('desabilita o botão de montar quando o orçamento é zero', async () => {
    const user = userEvent.setup()
    renderizar()
    await screen.findByRole('button', { name: /montar escalação ótima/i })

    await user.clear(screen.getByLabelText(/orçamento/i))
    await user.type(screen.getByLabelText(/orçamento/i), '0')

    expect(screen.getByRole('button', { name: /montar escalação ótima/i })).toBeDisabled()
  })

  it('previne o comportamento padrão de submit do navegador', async () => {
    renderizar()
    const botao = await screen.findByRole('button', { name: /montar escalação ótima/i })
    const form = botao.closest('form') as HTMLFormElement

    const naoCancelado = fireEvent.submit(form)

    expect(naoCancelado).toBe(false)
  })

  it('mostra estado de carregamento durante a otimização e o restaura ao concluir', async () => {
    const user = userEvent.setup()
    let resolverMontagem: (value: api.EscalacaoOtima) => void = () => {}
    vi.mocked(api.montarEscalacao).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolverMontagem = resolve
        }),
    )
    renderizar()
    const botao = await screen.findByRole('button', { name: /montar escalação ótima/i })
    await user.click(botao)

    const botaoCarregando = await screen.findByRole('button', { name: /calculando/i })
    expect(botaoCarregando).toBeDisabled()

    resolverMontagem(escalacao)

    expect(await screen.findByRole('heading', { name: /escalação sugerida/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /montar escalação ótima/i }),
    ).not.toBeDisabled()
  })

  it('limpa erro e resultado anteriores ao iniciar uma nova otimização', async () => {
    const user = userEvent.setup()
    renderizar()
    await screen.findByRole('button', { name: /montar escalação ótima/i })
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))
    expect(await screen.findByRole('heading', { name: /escalação sugerida/i })).toBeInTheDocument()

    vi.mocked(api.montarEscalacao).mockRejectedValueOnce(new Error('boom'))
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('boom')
    expect(screen.queryByRole('heading', { name: /escalação sugerida/i })).not.toBeInTheDocument()

    vi.mocked(api.montarEscalacao).mockResolvedValueOnce(escalacao)
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))

    expect(await screen.findByRole('heading', { name: /escalação sugerida/i })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('trata falhas parciais nas buscas de detalhes sem quebrar a escalação', async () => {
    vi.mocked(atletasApi.buscarAtleta).mockImplementation(async (id) => {
      if (id === 2) throw new Error('atleta indisponível')
      return {
        id,
        nome: `Nome ${id}`,
        posicao: id === 12 ? 'TEC' : 'GOL',
        clube_nome: `Clube ${id}`,
      } as atletasApi.Atleta
    })
    vi.mocked(raioXApi.buscarRaioXConfronto).mockImplementation(async (id) => {
      if (id === 3) throw new Error('raio-x indisponível')
      return {
        atleta_id: id,
        mando: 'casa',
        clube_adversario_nome: `Adversário ${id}`,
        media_no_mando: 6.5,
      } as raioXApi.RaioXConfronto
    })

    const user = userEvent.setup()
    renderizar()
    await screen.findByRole('button', { name: /montar escalação ótima/i })
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))

    expect(await screen.findByRole('heading', { name: /escalação sugerida/i })).toBeInTheDocument()
    // atleta 2: busca de perfil falhou, mas o raio-x deu certo — usa nome de fallback e
    // ainda assim recebe os dados de raio-x (média no mando)
    const linkAtleta2 = screen.getByRole('link', { name: /^atleta #2\b/i })
    expect(linkAtleta2).toHaveTextContent('Média casa: 6,5')
    // atleta 3: perfil carregou, mas o raio-x falhou — confronto fica indisponível
    const linkAtleta3 = screen.getByRole('link', { name: /^nome 3\b/i })
    expect(linkAtleta3).toHaveTextContent('Confronto não disponível')
    expect(linkAtleta3).not.toHaveTextContent('Média')
  })

  it('mostra mensagem de carregamento apenas enquanto não há esquemas nem erro', async () => {
    let resolverEsquemas: (value: api.EsquemasDisponiveis) => void = () => {}
    vi.mocked(api.buscarEsquemas).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolverEsquemas = resolve
        }),
    )
    renderizar()

    expect(screen.getByText('Carregando esquemas…')).toBeInTheDocument()

    resolverEsquemas(esquemas)
    await screen.findByText(/1 GOL/)

    expect(screen.queryByText('Carregando esquemas…')).not.toBeInTheDocument()
  })

  it('ignora a resolução tardia de um efeito de busca de esquemas já cancelado (StrictMode)', async () => {
    const esquemasVigentes = {
      '4-3-3': { GOL: 1, ZAG: 2, LAT: 2, MEI: 2, ATA: 4, TEC: 1 },
    } as unknown as api.EsquemasDisponiveis
    let chamadas = 0
    let resolverEfeitoObsoleto: (value: api.EsquemasDisponiveis) => void = () => {}
    vi.mocked(api.buscarEsquemas).mockImplementation(() => {
      chamadas += 1
      if (chamadas === 1) {
        return new Promise((resolve) => {
          resolverEfeitoObsoleto = resolve
        })
      }
      return Promise.resolve(esquemasVigentes)
    })

    renderizarStrict()

    expect(
      await screen.findByText('Formação: 1 GOL · 2 ZAG · 2 LAT · 2 MEI · 4 ATA · 1 TEC'),
    ).toBeInTheDocument()

    // resolve tardiamente o efeito já cancelado pelo cleanup do StrictMode
    resolverEfeitoObsoleto(esquemas)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(
      screen.getByText('Formação: 1 GOL · 2 ZAG · 2 LAT · 2 MEI · 4 ATA · 1 TEC'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Formação: 1 GOL · 2 ZAG · 2 LAT · 3 MEI · 3 ATA · 1 TEC'),
    ).not.toBeInTheDocument()
  })

  it('ignora a rejeição tardia de um efeito de busca de esquemas já cancelado (StrictMode)', async () => {
    const esquemasVigentes = {
      '4-3-3': { GOL: 1, ZAG: 2, LAT: 2, MEI: 2, ATA: 4, TEC: 1 },
    } as unknown as api.EsquemasDisponiveis
    let chamadas = 0
    let rejeitarEfeitoObsoleto: (err: Error) => void = () => {}
    vi.mocked(api.buscarEsquemas).mockImplementation(() => {
      chamadas += 1
      if (chamadas === 1) {
        return new Promise((_resolve, reject) => {
          rejeitarEfeitoObsoleto = reject
        })
      }
      return Promise.resolve(esquemasVigentes)
    })

    renderizarStrict()

    expect(
      await screen.findByText('Formação: 1 GOL · 2 ZAG · 2 LAT · 2 MEI · 4 ATA · 1 TEC'),
    ).toBeInTheDocument()

    // rejeita tardiamente o efeito já cancelado pelo cleanup do StrictMode
    rejeitarEfeitoObsoleto(new Error('efeito obsoleto'))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(
      screen.getByText('Formação: 1 GOL · 2 ZAG · 2 LAT · 2 MEI · 4 ATA · 1 TEC'),
    ).toBeInTheDocument()
  })

  it('mostra mensagem de espera quando recebe 429 com quota', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'montarEscalacao').mockRejectedValue(
      new ApiError('quota exceeded', 429, 'optimization_quota_exceeded', 10),
    )

    renderizar()
    await screen.findByRole('button', { name: /montar escalação ótima/i })
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))

    // Deve mostrar mensagem de espera
    expect(await screen.findByText(/preparando sua escalação/i)).toBeInTheDocument()
    // Botão de envio deve desaparecer, mostrando apenas cancelar
    expect(screen.queryByRole('button', { name: /montar escalação ótima/i })).not.toBeInTheDocument()
    // Formulário desabilitado
    expect(screen.getByLabelText(/orçamento/i)).toBeDisabled()
  })

  it('cancela espera e restaura formulário quando Cancelar é clicado', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'montarEscalacao').mockRejectedValue(
      new ApiError('quota exceeded', 429, 'optimization_quota_exceeded', 10),
    )

    renderizar()
    await screen.findByRole('button', { name: /montar escalação ótima/i })
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))

    expect(await screen.findByText(/preparando sua escalação/i)).toBeInTheDocument()

    // Clica em Cancelar
    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    await user.click(cancelButton)

    // Mensagem de espera desaparece, formulário é restaurado
    expect(screen.queryByText(/preparando sua escalação/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /montar escalação ótima/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/orçamento/i)).not.toBeDisabled()
  })

  it('trata 429 sem código de quota exibindo mensagem amigável sem retry', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'montarEscalacao').mockRejectedValue(
      new ApiError('Erro técnico 429', 429),
    )

    renderizar()
    await screen.findByRole('button', { name: /montar escalação ótima/i })
    await user.click(screen.getByRole('button', { name: /montar escalação ótima/i }))

    expect(
      await screen.findByText('Serviço temporariamente indisponível. Tente novamente em instantes.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/preparando sua escalação/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /montar escalação ótima/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/orçamento/i)).not.toBeDisabled()
  })

  it('limpa aguardandoRetry e desbloqueia formulário se o retry falhar com erro 500', async () => {
    let chamadas = 0
    vi.spyOn(api, 'montarEscalacao').mockImplementation(async () => {
      chamadas++
      if (chamadas === 1) {
        throw new ApiError('quota exceeded', 429, 'optimization_quota_exceeded', 5)
      }
      throw new Error('Erro interno do servidor (500)')
    })

    renderizar()
    const botaoMontar = await screen.findByRole('button', { name: /montar escalação ótima/i })

    vi.useFakeTimers()

    await fireEvent.click(botaoMontar)
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText(/preparando sua escalação/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/orçamento/i)).toBeDisabled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Erro interno do servidor (500)')
    expect(screen.queryByText(/preparando sua escalação/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /montar escalação ótima/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/orçamento/i)).not.toBeDisabled()

    vi.useRealTimers()
  })

  it('desabilita campos durante carregamento e reenvia parâmetros congelados no retry', async () => {
    let resolverPrimeiraChamada: () => void = () => {}
    const primeiraPromessa = new Promise<api.EscalacaoOtima>((_, reject) => {
      resolverPrimeiraChamada = () => {
        reject(new ApiError('quota exceeded', 429, 'optimization_quota_exceeded', 5))
      }
    })

    const spyMontar = vi.spyOn(api, 'montarEscalacao')
      .mockReturnValueOnce(primeiraPromessa)
      .mockResolvedValueOnce(escalacao)

    renderizar()
    const botaoMontar = await screen.findByRole('button', { name: /montar escalação ótima/i })
    const form = botaoMontar.closest('form')!

    vi.useFakeTimers()

    fireEvent.submit(form)

    // Durante o cálculo inicial (carregando), os campos devem estar desabilitados
    expect(screen.getByLabelText(/orçamento/i)).toBeDisabled()
    expect(screen.getByLabelText(/esquema/i)).toBeDisabled()
    expect(screen.getByLabelText(/modo/i)).toBeDisabled()

    await act(async () => {
      resolverPrimeiraChamada()
    })

    expect(screen.getByLabelText(/orçamento/i)).toBeDisabled()
    expect(screen.getByLabelText(/esquema/i)).toBeDisabled()
    expect(screen.getByLabelText(/modo/i)).toBeDisabled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(spyMontar).toHaveBeenCalledTimes(2)
    expect(spyMontar).toHaveBeenNthCalledWith(1, { orcamento: 100, esquema: '4-3-3', modo: 'classica' })
    expect(spyMontar).toHaveBeenNthCalledWith(2, { orcamento: 100, esquema: '4-3-3', modo: 'classica' })

    vi.useRealTimers()
  })

  it('não publica resultado de requisição que foi cancelada enquanto estava em andamento', async () => {
    let resolverPrimeiraChamada: () => void = () => {}
    const primeiraPromessa = new Promise<api.EscalacaoOtima>((_, reject) => {
      resolverPrimeiraChamada = () => {
        reject(new ApiError('quota exceeded', 429, 'optimization_quota_exceeded', 10))
      }
    })

    vi.spyOn(api, 'montarEscalacao').mockReturnValueOnce(primeiraPromessa)

    renderizar()
    const botaoMontar = await screen.findByRole('button', { name: /montar escalação ótima/i })
    const form = botaoMontar.closest('form')!

    vi.useFakeTimers()

    fireEvent.submit(form)

    await act(async () => {
      resolverPrimeiraChamada()
    })

    expect(screen.getByText(/preparando sua escalação/i)).toBeInTheDocument()

    let resolverRetry: (value: api.EscalacaoOtima) => void = () => {}
    const promessaRetry = new Promise<api.EscalacaoOtima>((resolve) => {
      resolverRetry = resolve
    })
    vi.spyOn(api, 'montarEscalacao').mockReturnValueOnce(promessaRetry)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000)
    })

    const botaoCancelar = screen.getByRole('button', { name: /cancelar/i })
    fireEvent.click(botaoCancelar)

    expect(screen.queryByText(/preparando sua escalação/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /montar escalação ótima/i })).toBeInTheDocument()

    await act(async () => {
      resolverRetry(escalacao)
      await vi.advanceTimersByTimeAsync(10)
    })

    expect(screen.queryByRole('heading', { name: /escalação sugerida/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /montar escalação ótima/i })).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('não agenda novo retry nem atualiza estado após desmontar o componente durante espera', async () => {
    let rejeitarChamada: () => void = () => {}
    const promessa = new Promise<api.EscalacaoOtima>((_, reject) => {
      rejeitarChamada = () => {
        reject(new ApiError('quota exceeded', 429, 'optimization_quota_exceeded', 5))
      }
    })

    const spyMontar = vi.spyOn(api, 'montarEscalacao').mockReturnValue(promessa)

    const { unmount } = renderizar()
    const botaoMontar = await screen.findByRole('button', { name: /montar escalação ótima/i })
    const form = botaoMontar.closest('form')!

    vi.useFakeTimers()

    fireEvent.submit(form)

    unmount()

    await act(async () => {
      rejeitarChamada()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000)
    })

    expect(spyMontar).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('aguarda o prazo de Retry-After e obtém sucesso no retry sem novo clique', async () => {
    let resolverPrimeiraChamada: () => void = () => {}
    const primeiraPromessa = new Promise<api.EscalacaoOtima>((_, reject) => {
      resolverPrimeiraChamada = () => {
        reject(new ApiError('quota exceeded', 429, 'optimization_quota_exceeded', 8))
      }
    })

    const spyMontar = vi.spyOn(api, 'montarEscalacao')
      .mockReturnValueOnce(primeiraPromessa)
      .mockResolvedValueOnce(escalacao)

    renderizar()
    const botaoMontar = await screen.findByRole('button', { name: /montar escalação ótima/i })
    const form = botaoMontar.closest('form')!

    vi.useFakeTimers()

    fireEvent.submit(form)

    await act(async () => {
      resolverPrimeiraChamada()
    })

    expect(screen.getByText(/preparando sua escalação/i)).toBeInTheDocument()
    expect(spyMontar).toHaveBeenCalledTimes(1)

    // Antes de 8 segundos, não deve reenviar
    await act(async () => {
      await vi.advanceTimersByTimeAsync(7000)
    })
    expect(spyMontar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('heading', { name: /escalação sugerida/i })).not.toBeInTheDocument()

    // Completa os 8 segundos
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(spyMontar).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(/preparando sua escalação/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /escalação sugerida/i })).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('trata dois 429 consecutivos respeitando cada novo prazo sem requisições simultâneas', async () => {
    const spyMontar = vi.spyOn(api, 'montarEscalacao')
      .mockRejectedValueOnce(new ApiError('quota 1', 429, 'optimization_quota_exceeded', 6))
      .mockRejectedValueOnce(new ApiError('quota 2', 429, 'optimization_quota_exceeded', 4))
      .mockResolvedValueOnce(escalacao)

    renderizar()
    const botaoMontar = await screen.findByRole('button', { name: /montar escalação ótima/i })
    const form = botaoMontar.closest('form')!

    vi.useFakeTimers()

    fireEvent.submit(form)

    await act(async () => {
      await Promise.resolve()
    })

    expect(spyMontar).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/preparando sua escalação/i)).toBeInTheDocument()

    // Avança 5s (antes do primeiro prazo de 6s): ainda apenas 1 chamada
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })
    expect(spyMontar).toHaveBeenCalledTimes(1)

    // Avança mais 1s (total 6s): dispara segunda chamada, que retorna 429 com prazo 4s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(spyMontar).toHaveBeenCalledTimes(2)
    expect(screen.getByText(/preparando sua escalação/i)).toBeInTheDocument()

    // Avança 3s (antes do segundo prazo de 4s): ainda 2 chamadas
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(spyMontar).toHaveBeenCalledTimes(2)

    // Avança mais 1s (total 4s pós-segundo erro): dispara terceira chamada e obtém sucesso
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(spyMontar).toHaveBeenCalledTimes(3)
    expect(screen.queryByText(/preparando sua escalação/i)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /escalação sugerida/i })).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('cancela timer de retry pendente e dispara novo cálculo se o formulário for submetido novamente', async () => {
    const spyMontar = vi.spyOn(api, 'montarEscalacao')
      .mockRejectedValueOnce(new ApiError('quota', 429, 'optimization_quota_exceeded', 8))
      .mockResolvedValueOnce(escalacao)

    renderizar()
    const botaoMontar = await screen.findByRole('button', { name: /montar escalação ótima/i })
    const form = botaoMontar.closest('form')!

    vi.useFakeTimers()

    fireEvent.submit(form)

    await act(async () => {
      await Promise.resolve()
    })

    expect(spyMontar).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/preparando sua escalação/i)).toBeInTheDocument()

    // Submete o formulário novamente enquanto o timer de 8s está ativo
    fireEvent.submit(form)

    await act(async () => {
      await Promise.resolve()
    })

    expect(spyMontar).toHaveBeenCalledTimes(2)

    // O timer da primeira requisição (8s) não deve disparar uma chamada fantasma extra
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000)
    })

    expect(spyMontar).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('heading', { name: /escalação sugerida/i })).toBeInTheDocument()

    vi.useRealTimers()
  })
})
