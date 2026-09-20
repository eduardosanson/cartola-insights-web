import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import * as atletasApi from '../api/atletas'
import * as clubesApi from '../api/clubes'
import DropdownFiltro from '../components/DropdownFiltro'
import Nav from '../components/Nav'
import PositionChips from '../components/PositionChips'
import { AuthProvider } from '../contexts/AuthContext'
import Jogadores from '../pages/Jogadores'
import Tabela from '../pages/Tabela'
import { atletaMock } from './fixtures'

describe('navegação por teclado (issue #7, RF04)', () => {
  it('Tab percorre os links do Nav em ordem e Enter navega', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AuthProvider>
          <Nav />
        </AuthProvider>
      </MemoryRouter>,
    )

    await user.tab()
    expect(screen.getByRole('link', { name: 'Tabela' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Jogadores' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('link', { name: 'Jogadores' })).toHaveAttribute('aria-current', 'page')
  })

  it('chips de posição: focáveis por Tab, acionáveis por Enter e Espaço', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<PositionChips selecionadas={[]} onToggle={onToggle} />)

    await user.tab()
    expect(screen.getByRole('button', { name: 'GOL' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onToggle).toHaveBeenLastCalledWith('GOL')

    await user.tab()
    expect(screen.getByRole('button', { name: 'ZAG' })).toHaveFocus()
    await user.keyboard(' ')
    expect(onToggle).toHaveBeenLastCalledWith('ZAG')
    expect(onToggle).toHaveBeenCalledTimes(2)
  })

  it('DropdownFiltro: abre com Enter/Espaço, seleciona opção com Enter/Espaço e fecha com Esc', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(
      <DropdownFiltro
        label="Posição"
        opcoes={[
          { valor: 'GOL', label: 'Goleiro' },
          { valor: 'ZAG', label: 'Zagueiro' },
        ]}
        selecionados={[]}
        onToggle={onToggle}
      />,
    )

    await user.tab()
    const gatilho = screen.getByRole('button', { name: /posição/i })
    expect(gatilho).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(gatilho).toHaveAttribute('aria-expanded', 'true')

    await user.tab()
    expect(screen.getByRole('option', { name: 'Goleiro' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.tab()
    expect(screen.getByRole('option', { name: 'Zagueiro' })).toHaveFocus()
    await user.keyboard(' ')
    expect(onToggle.mock.calls).toEqual([['GOL'], ['ZAG']])

    await user.keyboard('{Escape}')
    expect(gatilho).toHaveAttribute('aria-expanded', 'false')
  })

  it('cabeçalhos ordenáveis da Tabela: Tab foca, Enter e Espaço alternam a ordenação', async () => {
    vi.spyOn(clubesApi, 'listarClubes').mockResolvedValue([
      { id: 1, nome: 'Flamengo', media_pontos_casa: 55, media_pontos_fora: 48 },
    ])
    const user = userEvent.setup()
    render(<Tabela />)
    await screen.findByText('Flamengo')

    await user.tab()
    const casa = screen.getByRole('button', { name: /média casa/i })
    expect(casa).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(casa).toHaveTextContent('↓ 1')
    await user.keyboard(' ')
    expect(casa).toHaveTextContent('↑ 1')

    await user.tab()
    expect(screen.getByRole('button', { name: /média fora/i })).toHaveFocus()
  })

  it('Jogadores: busca, filtros, cabeçalhos ordenáveis e paginação entram na ordem de Tab', async () => {
    vi.spyOn(atletasApi, 'listarTodosAtletas').mockResolvedValue([atletaMock])
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Jogadores />
      </MemoryRouter>,
    )
    await screen.findByText('Gabigol')

    await user.tab()
    expect(screen.getByRole('searchbox')).toHaveFocus()
    for (const nome of [/status/i, /posição/i, /mando/i]) {
      await user.tab()
      expect(screen.getByRole('button', { name: nome })).toHaveFocus()
    }

    const cabecalho = within(screen.getByRole('table'))
    await user.tab()
    const preco = cabecalho.getByRole('button', { name: /preço/i })
    expect(preco).toHaveFocus()
    await user.keyboard(' ')
    expect(preco).toHaveTextContent('↓ 1')
  })
})
