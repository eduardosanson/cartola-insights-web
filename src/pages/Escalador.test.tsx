import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as atletasApi from '../api/atletas'
import * as api from '../api/otimizador'
import * as raioXApi from '../api/raioX'
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
})
