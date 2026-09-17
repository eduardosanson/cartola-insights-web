import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import Registro from './Registro'
import * as contasApi from '../api/contas'
import type { Usuario } from '../api/contas'

vi.mock('../api/contas')

type MensagemState = { mensagem?: string }

function TelaLogin() {
  const location = useLocation()
  const state = location.state as MensagemState | null
  return <p>tela de login: {state?.mensagem ?? '(sem mensagem)'}</p>
}

function renderRegistro() {
  render(
    <MemoryRouter initialEntries={['/registrar']}>
      <Routes>
        <Route path="/registrar" element={<Registro />} />
        <Route path="/entrar" element={<TelaLogin />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function preencherFormulario(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email/i), 'a@b.com')
  await user.type(screen.getByLabelText(/senha/i), 'segredo123')
}

describe('Registro', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('registra e redireciona para /entrar com a mensagem de sucesso', async () => {
    vi.mocked(contasApi.registrar).mockResolvedValue({ id: 1, email: 'a@b.com', role: 'usuario' })
    renderRegistro()
    const user = userEvent.setup()

    await preencherFormulario(user)
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(contasApi.registrar).toHaveBeenCalledWith('a@b.com', 'segredo123')
    expect(
      await screen.findByText('tela de login: Conta criada! Faça login.'),
    ).toBeInTheDocument()
  })

  it('previne o comportamento padrão de submit do navegador', async () => {
    vi.mocked(contasApi.registrar).mockResolvedValue({ id: 1, email: 'a@b.com', role: 'usuario' })
    renderRegistro()
    const user = userEvent.setup()
    await preencherFormulario(user)

    const form = screen
      .getByRole('button', { name: /criar conta/i })
      .closest('form') as HTMLFormElement
    const naoFoiCancelado = fireEvent.submit(form)

    expect(naoFoiCancelado).toBe(false)
    await screen.findByText(/tela de login/)
  })

  it('limpa erro anterior e mostra estado "Criando…" desabilitado enquanto envia', async () => {
    vi.mocked(contasApi.registrar).mockRejectedValueOnce(new Error('falha anterior'))
    renderRegistro()
    const user = userEvent.setup()
    await preencherFormulario(user)
    await user.click(screen.getByRole('button', { name: /criar conta/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('falha anterior')

    let liberarRegistro!: (value: Usuario) => void
    vi.mocked(contasApi.registrar).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          liberarRegistro = resolve
        }),
    )

    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criando…' })).toBeDisabled()

    liberarRegistro({ id: 1, email: 'a@b.com', role: 'usuario' as const })
    await screen.findByText(/tela de login/)
  })

  it('mostra mensagem de erro em caso de email duplicado e reabilita o botão', async () => {
    vi.mocked(contasApi.registrar).mockRejectedValue(
      new Error('email já cadastrado: a@b.com'),
    )
    renderRegistro()
    const user = userEvent.setup()

    await preencherFormulario(user)
    await user.click(screen.getByRole('button', { name: /criar conta/i }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('email já cadastrado')
    expect(alerta).toHaveStyle({ color: 'var(--danger)' })

    expect(screen.getByRole('button', { name: 'Criar conta' })).not.toBeDisabled()
  })
})
