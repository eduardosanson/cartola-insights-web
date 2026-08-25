import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AtletaAutocomplete from './AtletaAutocomplete'
import * as atletasApi from '../api/atletas'
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

describe('AtletaAutocomplete', () => {
  it('renderiza um input type="search" e filtra a lista ao digitar (debounced)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      criarAtleta({ id: 1, nome: 'Gabigol' }),
      criarAtleta({ id: 2, nome: 'Cassio', posicao: 'GOL' }),
    ])
    const onSelecionar = vi.fn()

    render(<AtletaAutocomplete onSelecionar={onSelecionar} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'Gabi' } })

    // debounce ainda não disparou
    expect(screen.queryByText('Gabigol')).not.toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Gabigol')).toBeInTheDocument(), {
      timeout: 1000,
    })
    expect(screen.queryByText('Cassio')).not.toBeInTheDocument()
  })

  it('ao selecionar uma opção, chama onSelecionar com o Atleta completo e fecha a lista', async () => {
    const gabigol = criarAtleta({ id: 1, nome: 'Gabigol' })
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([gabigol])
    const onSelecionar = vi.fn()
    const user = userEvent.setup()

    render(<AtletaAutocomplete onSelecionar={onSelecionar} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'Gabi' } })

    const opcao = await screen.findByRole('option', { name: /gabigol/i }, { timeout: 1000 })
    await user.click(opcao)

    expect(onSelecionar).toHaveBeenCalledWith(gabigol)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('prioriza atletas da posicaoPrioritaria no topo da lista, sem remover outras posições', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      criarAtleta({ id: 1, nome: 'Cassio Goleiro', posicao: 'GOL' }),
      criarAtleta({ id: 2, nome: 'Casemiro Meia', posicao: 'MEI' }),
    ])
    const onSelecionar = vi.fn()

    render(<AtletaAutocomplete onSelecionar={onSelecionar} posicaoPrioritaria="MEI" />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'Cas' } })

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2), {
      timeout: 1000,
    })

    const opcoes = screen.getAllByRole('option')
    expect(opcoes[0]).toHaveTextContent('Casemiro Meia')
    expect(opcoes[1]).toHaveTextContent('Cassio Goleiro')
  })
})
