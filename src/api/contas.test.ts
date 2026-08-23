import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  registrar,
  login,
  logout,
  obterUsuarioAtual,
  gerarToken,
  listarTokens,
  revogarToken,
} from './contas'

function mockFetchOk(status: number, corpo: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status,
      statusText: 'OK',
      json: async () => corpo,
    }),
  )
}

describe('api/contas', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('registrar chama POST /contas/registro com email e senha', async () => {
    mockFetchOk(201, { id: 1, email: 'a@b.com', role: 'usuario' })
    const usuario = await registrar('a@b.com', 'segredo123')
    expect(usuario).toEqual({ id: 1, email: 'a@b.com', role: 'usuario' })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/registro',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', senha: 'segredo123' }),
      }),
    )
  })

  it('login chama POST /contas/login com email e senha', async () => {
    mockFetchOk(200, { id: 1, email: 'a@b.com', role: 'usuario' })
    const usuario = await login('a@b.com', 'segredo123')
    expect(usuario.email).toBe('a@b.com')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', senha: 'segredo123' }),
      }),
    )
  })

  it('logout chama POST /contas/logout', async () => {
    mockFetchOk(204, {})
    await logout()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/logout',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('obterUsuarioAtual chama GET /contas/me', async () => {
    mockFetchOk(200, { id: 1, email: 'a@b.com', role: 'admin' })
    const usuario = await obterUsuarioAtual()
    expect(usuario.role).toBe('admin')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/me',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('gerarToken chama POST /contas/tokens e retorna o valor cru', async () => {
    mockFetchOk(201, { id: 5, token: 'abc123' })
    const criado = await gerarToken()
    expect(criado.token).toBe('abc123')
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/tokens',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('listarTokens chama GET /contas/tokens', async () => {
    mockFetchOk(200, [{ id: 5, criado_em: '2026-08-23T00:00:00Z', revogado_em: null }])
    const tokens = await listarTokens()
    expect(tokens).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/tokens',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('revogarToken chama DELETE /contas/tokens/{id}', async () => {
    mockFetchOk(204, {})
    await revogarToken(5)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/contas/tokens/5',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})
