import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Nav from './Nav'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

describe('Nav', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('mostra link Entrar quando deslogado', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: null,
      carregando: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /entrar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /comparar/i })).toHaveAttribute('href', '/comparar')
    expect(screen.getByRole('link', { name: /patrimônio/i })).toHaveAttribute(
      'href',
      '/patrimonio',
    )
    expect(screen.getByRole('link', { name: /escalador/i })).toHaveAttribute(
      'href',
      '/escalador',
    )
    expect(screen.getByRole('link', { name: /matriz de capitão/i })).toHaveAttribute(
      'href',
      '/capitaes',
    )
    expect(screen.getByRole('link', { name: /^alertas$/i })).toHaveAttribute('href', '/alertas')

    const entrarLink = screen.getByRole('link', { name: /entrar/i })
    expect(entrarLink).toHaveStyle({
      padding: '0.5rem 1rem',
      textDecoration: 'none',
      fontFamily: 'var(--font-heading)',
      color: 'var(--text)',
      borderBottom: '2px solid rgba(0, 0, 0, 0)',
    })
    expect(entrarLink.parentElement).toHaveStyle({
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    })
  })

  it('mostra o email e o botão Sair quando logado', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: { id: 1, email: 'a@b.com', role: 'usuario' },
      carregando: false,
      refetch: vi.fn(),
      logout,
    })
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    )

    const emailLink = screen.getByRole('link', { name: 'a@b.com' })
    expect(emailLink).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sair/i }).parentElement).toHaveStyle({
      marginLeft: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /sair/i }))
    expect(logout).toHaveBeenCalled()
  })

  it('aplica display flex, borda e espaçamento no container do menu', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: null,
      carregando: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>,
    )

    expect(screen.getByRole('navigation')).toHaveStyle({
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      marginBottom: '1.5rem',
    })
  })

  it('destaca o link ativo com cor e borda diferentes do link inativo', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: null,
      carregando: false,
      refetch: vi.fn(),
      logout: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/tabela']}>
        <Nav />
      </MemoryRouter>,
    )

    const linkAtivo = screen.getByRole('link', { name: /tabela/i })
    expect(linkAtivo).toHaveStyle({
      padding: '0.5rem 1rem',
      color: 'var(--accent-home)',
    })
    // jsdom não reconstrói corretamente o shorthand `border-bottom` quando a cor
    // é uma CSS custom property, então comparamos o atributo `style` bruto para
    // matar os mutantes de fontFamily/textDecoration/borderBottom nesta linha.
    expect(linkAtivo.getAttribute('style')).toContain('text-decoration: none')
    expect(linkAtivo.getAttribute('style')).toContain('font-family: var(--font-heading)')
    expect(linkAtivo.getAttribute('style')).toContain('border-bottom: 2px solid var(--accent-home)')

    const linkInativo = screen.getByRole('link', { name: /jogadores/i })
    expect(linkInativo).toHaveStyle({
      color: 'var(--text)',
      borderBottom: '2px solid rgba(0, 0, 0, 0)',
    })
  })

  it('navega para home mesmo se logout falhar', async () => {
    const logout = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      usuario: { id: 1, email: 'a@b.com', role: 'usuario' },
      carregando: false,
      refetch: vi.fn(),
      logout,
    })
    render(
      <MemoryRouter initialEntries={['/conta']}>
        <Routes>
          <Route path="/" element={<div>Home Page</div>} />
          <Route path="/conta" element={<Nav />} />
        </Routes>
      </MemoryRouter>,
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /sair/i }))
    expect(logout).toHaveBeenCalled()
    expect(await screen.findByText('Home Page')).toBeInTheDocument()
  })
})
