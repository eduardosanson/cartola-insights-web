import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    expect(screen.getByRole('button', { name: /montar escalação ótima/i })).toBeDisabled()
  })
})
