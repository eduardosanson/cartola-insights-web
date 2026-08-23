import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Registro from './Registro'
import * as contasApi from '../api/contas'

vi.mock('../api/contas')

function renderRegistro() {
  render(
    <MemoryRouter initialEntries={['/registrar']}>
      <Routes>
        <Route path="/registrar" element={<Registro />} />
        <Route
          path="/entrar"
          element={<p>tela de login</p>}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Registro', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('registra e redireciona para /entrar em caso de sucesso', async () => {
    vi.mocked(contasApi.registrar).mockResolvedValue({ id: 1, email: 'a@b.com', role: 'usuario' })
    renderRegistro()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), 'segredo123')
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(contasApi.registrar).toHaveBeenCalledWith('a@b.com', 'segredo123')
    expect(await screen.findByText('tela de login')).toBeInTheDocument()
  })

  it('mostra mensagem de erro em caso de email duplicado', async () => {
    vi.mocked(contasApi.registrar).mockRejectedValue(
      new Error('email já cadastrado: a@b.com'),
    )
    renderRegistro()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/email/i), 'a@b.com')
    await user.type(screen.getByLabelText(/senha/i), 'segredo123')
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('email já cadastrado')
  })
})
