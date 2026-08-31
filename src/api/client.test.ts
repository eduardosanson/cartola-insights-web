import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiDelete, apiGet, apiPost } from './client'

describe('apiGet', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON on a 2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ hello: 'world' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiGet<{ hello: string }>('/clubes')

    expect(result).toEqual({ hello: 'world' })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/clubes', {
      credentials: 'include',
    })
  })

  it('throws a clear error on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      }),
    )

    await expect(apiGet('/clubes')).rejects.toThrow(/500/)
  })

  it('preserva o status HTTP no erro', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => ({ detail: 'entrada inválida' }),
      }),
    )

    await expect(apiGet('/clubes')).rejects.toMatchObject({
      message: 'entrada inválida',
      status: 422,
    })
  })

  it('throws a clear error on a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')))

    await expect(apiGet('/clubes')).rejects.toThrow(/Falha de rede/)
  })
})

describe('apiPost', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a JSON body and returns the parsed response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      json: async () => ({ id: 1 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiPost<{ id: number }>('/contas/registro', {
      email: 'a@b.com',
      senha: 'segredo123',
    })

    expect(result).toEqual({ id: 1 })
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/contas/registro', {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com', senha: 'segredo123' }),
    })
  })

  it('posts without a body when none is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiPost<undefined>('/contas/logout')

    expect(result).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/contas/logout', {
      credentials: 'include',
      method: 'POST',
      headers: undefined,
      body: undefined,
    })
  })

  it('throws the backend detail message on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => ({ detail: 'email já cadastrado: a@b.com' }),
      }),
    )

    await expect(apiPost('/contas/registro', { email: 'a@b.com' })).rejects.toThrow(
      'email já cadastrado: a@b.com',
    )
  })
})

describe('apiDelete', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a DELETE request and resolves with no value', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiDelete('/contas/tokens/1')

    expect(result).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/contas/tokens/1', {
      credentials: 'include',
      method: 'DELETE',
    })
  })
})

describe('X-Service-Token e tratamento de autenticação (Issue #9)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('injeta X-Service-Token nas chamadas GET quando VITE_SERVICE_TOKEN está configurado', async () => {
    vi.stubEnv('VITE_SERVICE_TOKEN', 'token-secreto-123')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ status: 'ok' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiGet('/clubes')

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/clubes', {
      credentials: 'include',
      headers: {
        'X-Service-Token': 'token-secreto-123',
      },
    })
  })

  it('injeta X-Service-Token nas chamadas POST preservando Content-Type', async () => {
    vi.stubEnv('VITE_SERVICE_TOKEN', 'token-secreto-123')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiPost('/otimizador/escalacao', { esquema: '4-3-3' })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/otimizador/escalacao', {
      credentials: 'include',
      method: 'POST',
      headers: {
        'X-Service-Token': 'token-secreto-123',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ esquema: '4-3-3' }),
    })
  })

  it('injeta X-Service-Token nas chamadas DELETE', async () => {
    vi.stubEnv('VITE_SERVICE_TOKEN', 'token-secreto-123')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: async () => ({}),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiDelete('/contas/tokens/1')

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/contas/tokens/1', {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        'X-Service-Token': 'token-secreto-123',
      },
    })
  })

  it('não envia X-Service-Token e não quebra quando a variável não está definida', async () => {
    vi.stubEnv('VITE_SERVICE_TOKEN', '')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ ok: true }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiGet('/clubes')

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/clubes', {
      credentials: 'include',
    })
  })

  it('retorna mensagem "Acesso não autorizado" para erro 401 sem detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({}),
      }),
    )

    await expect(apiGet('/admin/logs')).rejects.toMatchObject({
      message: 'Acesso não autorizado',
      status: 401,
    })
  })

  it('retorna mensagem "Acesso negado" para erro 403 sem detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({}),
      }),
    )

    await expect(apiGet('/admin/logs')).rejects.toMatchObject({
      message: 'Acesso negado',
      status: 403,
    })
  })

  it('preserva mensagem detail do backend em caso de 401/403 com payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Service token inválido ou expirado' }),
      }),
    )

    await expect(apiGet('/admin/logs')).rejects.toMatchObject({
      message: 'Service token inválido ou expirado',
      status: 401,
    })
  })
})

