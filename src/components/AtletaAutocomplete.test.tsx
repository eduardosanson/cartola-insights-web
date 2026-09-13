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

  it('ao selecionar uma opção, chama onSelecionar com o Atleta completo, fecha a lista e atualiza o input', async () => {
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
    // Mata mutante que remove `setNomeInput(atleta.nome)`: sem essa chamada o
    // input continuaria com o texto de busca ("Gabi") em vez do nome completo.
    expect((input as HTMLInputElement).value).toBe('Gabigol')
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

  it('mantém ordenação estável (por prioridade, preservando a ordem original dentro de cada grupo) com várias posições intercaladas', async () => {
    // Posições intercaladas GOL/MEI/GOL/MEI: com apenas 2 atletas o
    // algoritmo de sort do V8 pode "acertar por sorte" mesmo com um
    // comparador quebrado (aPrioritario/bPrioritario fixos em
    // true/false, ou sem o atalho de empate). Com 4 elementos o efeito
    // desses mutantes na ordem final passa a ser observável de forma
    // determinística.
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      criarAtleta({ id: 1, nome: 'Everton Zaga', posicao: 'GOL' }),
      criarAtleta({ id: 2, nome: 'Everton Meiao', posicao: 'MEI' }),
      criarAtleta({ id: 3, nome: 'Everton Goleiro2', posicao: 'GOL' }),
      criarAtleta({ id: 4, nome: 'Everton Camisa10', posicao: 'MEI' }),
    ])
    const onSelecionar = vi.fn()

    render(<AtletaAutocomplete onSelecionar={onSelecionar} posicaoPrioritaria="MEI" />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'Everton' } })

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(4), {
      timeout: 1000,
    })

    const opcoes = screen.getAllByRole('option')
    expect(opcoes.map((o) => o.textContent)).toEqual([
      expect.stringContaining('Everton Meiao'),
      expect.stringContaining('Everton Camisa10'),
      expect.stringContaining('Everton Zaga'),
      expect.stringContaining('Everton Goleiro2'),
    ])
  })

  it('sanitiza HTML digitado no campo de busca antes de armazenar (issue #10)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      criarAtleta({ id: 1, nome: 'Neymar' }),
    ])
    const onSelecionar = vi.fn()

    render(<AtletaAutocomplete onSelecionar={onSelecionar} />)
    await waitFor(() => expect(atletasApi.listarTodosAtletas).toHaveBeenCalled())

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: '<img src=x onerror=alert(1)>Neymar' } })

    expect((input as HTMLInputElement).value).toBe('Neymar')
  })

  it('não quebra e mantém a lista fechada quando o debounce dispara antes de todosAtletas carregar', async () => {
    // listarTodosAtletas nunca resolve nesta suíte: todosAtletas permanece
    // `null` mesmo depois do debounce de 300ms. Mata os mutantes que
    // substituem `if (!todosAtletas) return []` por `if (false) ...`
    // (chegaria a `todosAtletas.filter(...)` com `todosAtletas === null`,
    // lançando TypeError) e o que troca o `[]` retornado por um array não
    // vazio (a lista apareceria mesmo sem dados).
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockReturnValue(new Promise(() => {}))
    const onSelecionar = vi.fn()

    render(<AtletaAutocomplete onSelecionar={onSelecionar} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'Gabi' } })

    await waitFor(
      () => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      },
      { timeout: 1000 },
    )
  })

  it('ignora espaços extras no início/fim do termo buscado (trim)', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      criarAtleta({ id: 1, nome: 'Gabigol' }),
    ])
    const onSelecionar = vi.fn()

    render(<AtletaAutocomplete onSelecionar={onSelecionar} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: '  Gabi  ' } })

    await waitFor(() => expect(screen.getByText('Gabigol')).toBeInTheDocument(), {
      timeout: 1000,
    })
  })

  it('esconde a lista quando o campo de busca fica vazio após ter tido resultados', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      criarAtleta({ id: 1, nome: 'Gabigol' }),
    ])
    const onSelecionar = vi.fn()

    render(<AtletaAutocomplete onSelecionar={onSelecionar} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'Gabi' } })
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument(), {
      timeout: 1000,
    })

    fireEvent.change(input, { target: { value: '' } })
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument(), {
      timeout: 1000,
    })
  })

  it('esconde a lista quando a busca não encontra nenhum atleta', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      criarAtleta({ id: 1, nome: 'Gabigol' }),
    ])
    const onSelecionar = vi.fn()

    render(<AtletaAutocomplete onSelecionar={onSelecionar} />)
    await waitFor(() => expect(atletasApi.listarTodosAtletas).toHaveBeenCalled())

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'zzznaoexiste' } })

    // Espera o debounce passar mantendo o campo aberto (`aberto === true`)
    // e sem nenhum resultado — mata os mutantes que trocam
    // `resultados.length > 0` por `true`/`resultados.length >= 0`, que
    // fariam a lista (vazia) aparecer mesmo assim.
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('aplica os estilos inline exatos ao wrapper, à lista e às opções', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([
      criarAtleta({ id: 1, nome: 'Gabigol' }),
    ])
    const onSelecionar = vi.fn()

    render(<AtletaAutocomplete onSelecionar={onSelecionar} />)

    const input = screen.getByRole('searchbox')
    const wrapper = input.closest('div')
    expect(wrapper).toHaveStyle({ position: 'relative' })

    fireEvent.change(input, { target: { value: 'Gabi' } })

    const lista = await screen.findByRole('listbox', {}, { timeout: 1000 })
    expect(lista).toHaveStyle({
      position: 'absolute',
      top: '100%',
      left: '0px',
      right: '0px',
      margin: '0.25rem 0px 0px',
      padding: '0.25rem',
      listStyle: 'none',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: '9px',
      maxHeight: '260px',
      overflowY: 'auto',
    })

    const opcao = screen.getByRole('option', { name: /gabigol/i })
    expect(opcao).toHaveStyle({
      padding: '0.4rem 0.5rem',
      borderRadius: '6px',
      cursor: 'pointer',
      color: 'var(--text)',
    })
  })
})
