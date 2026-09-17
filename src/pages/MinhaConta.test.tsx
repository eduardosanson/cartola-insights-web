import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MinhaConta from './MinhaConta'
import * as contasApi from '../api/contas'
import * as AuthContextModule from '../contexts/AuthContext'

vi.mock('../api/contas')
vi.mock('../contexts/AuthContext', async () => {
  const real = await vi.importActual<typeof import('../contexts/AuthContext')>(
    '../contexts/AuthContext',
  )
  return { ...real, useAuth: vi.fn() }
})

function mockUsuarioLogado() {
  vi.mocked(AuthContextModule.useAuth).mockReturnValue({
    usuario: { id: 1, email: 'a@b.com', role: 'usuario' },
    carregando: false,
    refetch: vi.fn(),
    logout: vi.fn(),
  })
}

describe('MinhaConta', () => {
  afterEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
  })

  it('mostra o email do usuário e a lista de tokens', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([
      { id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: null },
    ])

    render(<MinhaConta />)

    expect(screen.getByText(/a@b.com/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())
    // com tokens carregados e não vazios, nenhuma das outras mensagens de
    // estado (carregando / lista vazia) nem o painel de "token recém-gerado"
    // devem aparecer
    expect(screen.queryByText('Carregando tokens…')).not.toBeInTheDocument()
    expect(screen.queryByText(/nenhum token gerado/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('mostra "Carregando tokens…" enquanto a listagem está pendente e some depois', async () => {
    mockUsuarioLogado()
    let resolverListagem!: (valor: contasApi.ApiToken[]) => void
    vi.mocked(contasApi.listarTokens).mockReturnValue(
      new Promise((resolve) => {
        resolverListagem = resolve
      }),
    )

    render(<MinhaConta />)

    expect(screen.getByText('Carregando tokens…')).toBeInTheDocument()
    expect(screen.queryByText(/nenhum token gerado/i)).not.toBeInTheDocument()

    resolverListagem([])

    await waitFor(() =>
      expect(screen.queryByText('Carregando tokens…')).not.toBeInTheDocument(),
    )
    expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument()
  })

  it('mostra estado vazio quando não há tokens', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([])

    render(<MinhaConta />)

    await waitFor(() =>
      expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument(),
    )
    // com a lista vazia, a tabela de tokens não deve ser renderizada
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('gera um token, mostra o valor cru uma vez e recarrega a lista', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 2, criado_em: '2026-08-23T00:00:00Z', revogado_em: null },
      ])
    vi.mocked(contasApi.gerarToken).mockResolvedValue({
      id: 2,
      token: 'valor-cru-do-token',
    })
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /gerar token/i }))

    expect(await screen.findByText('valor-cru-do-token')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument()
    // a lista deve ser recarregada após gerar o token (segunda chamada)
    await waitFor(() => expect(contasApi.listarTokens).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())
  })

  it('mostra erro quando a geração de token falha e limpa o erro numa tentativa seguinte bem-sucedida', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([])
    vi.mocked(contasApi.gerarToken)
      .mockRejectedValueOnce(new Error('falha ao gerar token'))
      .mockResolvedValueOnce({ id: 5, token: 'token-novo' })
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /gerar token/i }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('falha ao gerar token')
    expect(alerta).toHaveStyle({ color: 'var(--danger)' })

    await user.click(screen.getByRole('button', { name: /gerar token/i }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(await screen.findByText('token-novo')).toBeInTheDocument()
  })

  it('copia o token gerado para a área de transferência quando ela está disponível', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([])
    vi.mocked(contasApi.gerarToken).mockResolvedValue({
      id: 6,
      token: 'token-para-copiar',
    })
    const user = userEvent.setup()
    const writeText = vi.fn()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /gerar token/i }))
    await screen.findByText('token-para-copiar')

    await user.click(screen.getByRole('button', { name: /copiar/i }))

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith('token-para-copiar')
  })

  it('não quebra ao clicar em copiar quando o navigator não suporta clipboard', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([])
    vi.mocked(contasApi.gerarToken).mockResolvedValue({
      id: 7,
      token: 'token-sem-clipboard',
    })
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /gerar token/i }))
    await screen.findByText('token-sem-clipboard')

    await user.click(screen.getByRole('button', { name: /copiar/i }))

    expect(screen.getByText('token-sem-clipboard')).toBeInTheDocument()
  })

  it('revoga um token e atualiza a lista', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens)
      .mockResolvedValueOnce([{ id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: null }])
      .mockResolvedValueOnce([
        { id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: '2026-08-23T01:00:00Z' },
      ])
    vi.mocked(contasApi.revogarToken).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /revogar/i }))

    expect(contasApi.revogarToken).toHaveBeenCalledWith(1)
    await waitFor(() => expect(screen.getByText('Revogado')).toBeInTheDocument())
  })

  it('mantém a lista já carregada visível quando uma ação seguinte falha', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens)
      .mockResolvedValueOnce([{ id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: null }])
      .mockRejectedValueOnce(new Error('falha ao atualizar lista'))
    vi.mocked(contasApi.revogarToken).mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /revogar/i }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('falha ao atualizar lista')
    expect(alerta).toHaveStyle({ color: 'var(--danger)' })
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('mostra erro quando revogar falha e limpa o erro numa revogação seguinte bem-sucedida', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens)
      .mockResolvedValueOnce([{ id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: null }])
      .mockResolvedValueOnce([
        { id: 1, criado_em: '2026-08-23T00:00:00Z', revogado_em: '2026-08-23T01:00:00Z' },
      ])
    vi.mocked(contasApi.revogarToken)
      .mockRejectedValueOnce(new Error('falha ao revogar'))
      .mockResolvedValueOnce(undefined)
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText('Ativo')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /revogar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('falha ao revogar')

    await user.click(screen.getByRole('button', { name: /revogar/i }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('Revogado')).toBeInTheDocument())
  })

  it('desabilita o botão "Gerar token" enquanto a chamada está em andamento', async () => {
    mockUsuarioLogado()
    vi.mocked(contasApi.listarTokens).mockResolvedValue([])
    let resolverGeracao!: (valor: { id: number; token: string }) => void
    vi.mocked(contasApi.gerarToken).mockReturnValue(
      new Promise((resolve) => {
        resolverGeracao = resolve
      }),
    )
    const user = userEvent.setup()

    render(<MinhaConta />)
    await waitFor(() => expect(screen.getByText(/nenhum token gerado/i)).toBeInTheDocument())

    const botao = screen.getByRole('button', { name: /gerar token/i })
    await user.click(botao)

    expect(screen.getByRole('button', { name: /gerando/i })).toBeDisabled()

    resolverGeracao({ id: 3, token: 'outro-token' })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^gerar token$/i })).not.toBeDisabled(),
    )
  })
})
