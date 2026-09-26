import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { handleProxy, matchRoute } from './proxy.js'

const ENV = { BACKEND_ORIGIN: 'https://backend.test', SERVICE_TOKEN: 'segredo-do-servidor', NODE_ENV: 'production' }
const req = (path: string, init?: RequestInit) => new Request(`https://app.test/api/proxy${path}`, init)

let upstream: ReturnType<typeof vi.fn>
beforeEach(() => {
  upstream = vi.fn(async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }))
  vi.stubGlobal('fetch', upstream)
  for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v)
})
afterEach(() => vi.unstubAllEnvs())

const sentHeaders = () => new Headers((upstream.mock.calls[0][1] as RequestInit).headers)

describe('matchRoute', () => {
  it.each([
    ['GET', '/atletas'], ['GET', '/atletas/12'], ['GET', '/atletas/12/historico'], ['GET', '/atletas/12/percentis'],
    ['GET', '/atletas/12/perfil-risco'], ['GET', '/atletas/12/raio-x'], ['GET', '/atletas/12/mpv'], ['GET', '/clubes'],
    ['GET', '/mercado/status-alterados'], ['GET', '/mercado/curva-valorizacao'], ['GET', '/otimizador/esquemas'],
    ['GET', '/otimizador/matriz-capitao'], ['GET', '/otimizador/substituto/9'], ['GET', '/contas/me'], ['GET', '/contas/tokens'],
    ['POST', '/otimizador/escalar'], ['POST', '/contas/registro'], ['POST', '/contas/login'], ['POST', '/contas/logout'],
    ['POST', '/contas/tokens'], ['DELETE', '/contas/tokens/3'],
  ])('permite %s %s', (m, p) => expect(matchRoute(m, p)).toBe(true))

  it.each([
    ['GET', '/admin'], ['GET', '/metrics'], ['GET', '/contas/login-token'], ['POST', '/contas/login-token'],
    ['GET', '/atletas/abc'], ['GET', '/atletas/1/../admin'], ['GET', '/atletas/%2e%2e/admin'], ['GET', '//evil.com/atletas'],
    ['GET', 'https://evil.com/atletas'], ['GET', '/atletas/'], ['PUT', '/atletas'], ['PATCH', '/contas/me'],
    ['DELETE', '/atletas/1'], ['POST', '/atletas'], ['GET', '/rota-nova'], ['GET', '/atletas/1\\..'],
  ])('rejeita %s %s', (m, p) => expect(matchRoute(m, p)).toBe(false))
})

describe('handleProxy', () => {
  it('injeta o token do servidor e nunca o devolve ao cliente', async () => {
    const res = await handleProxy(req('/atletas?pagina=2', { headers: { 'x-service-token': 'forjado' } }))
    expect(upstream.mock.calls[0][0]).toBe('https://backend.test/atletas?pagina=2')
    expect(sentHeaders().get('x-service-token')).toBe('segredo-do-servidor')
    expect(JSON.stringify([...res.headers])).not.toContain('segredo-do-servidor')
    expect(await res.text()).not.toContain('segredo-do-servidor')
  })

  it.each(['/admin', '/metrics', '/contas/login-token', '/atletas/1/../admin', '//evil.com/x'])('rejeita %s localmente sem chamar o backend', async (p) => {
    const res = await handleProxy(req(p))
    expect(res.status).toBe(404)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('rejeita método não permitido com 405', async () => {
    const res = await handleProxy(req('/atletas', { method: 'PUT' }))
    expect(res.status).toBe(405)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('encaminha cookies e Set-Cookie (login/logout)', async () => {
    const h = new Headers({ 'content-type': 'application/json' })
    h.append('set-cookie', 'session=abc; HttpOnly; Path=/')
    h.append('set-cookie', 'visitor=xyz; HttpOnly; Path=/')
    upstream.mockResolvedValueOnce(new Response('{}', { status: 200, headers: h }))
    const res = await handleProxy(req('/contas/login', { method: 'POST', headers: { cookie: 'session=abc; visitor=xyz', 'content-type': 'application/json' }, body: '{"a":1}' }))
    expect(sentHeaders().get('cookie')).toBe('session=abc; visitor=xyz')
    expect(res.headers.getSetCookie()).toEqual(['session=abc; HttpOnly; Path=/', 'visitor=xyz; HttpOnly; Path=/'])
  })

  it('preserva 429 de quota com Retry-After e código', async () => {
    upstream.mockResolvedValueOnce(new Response('{"code":"optimization_quota_exceeded"}', { status: 429, headers: { 'retry-after': '42', 'content-type': 'application/json' } }))
    const res = await handleProxy(req('/otimizador/escalar', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('42')
    expect(await res.json()).toEqual({ code: 'optimization_quota_exceeded' })
  })

  it.each([401, 403])('preserva %i do backend', async (status) => {
    upstream.mockResolvedValueOnce(new Response('{"detail":"x"}', { status }))
    expect((await handleProxy(req('/contas/me'))).status).toBe(status)
  })

  it('remove headers hop-by-hop e não repassa headers arbitrários do navegador', async () => {
    upstream.mockResolvedValueOnce(new Response('x', { headers: { connection: 'close', 'transfer-encoding': 'chunked', 'x-service-token': 'vazou' } }))
    const res = await handleProxy(req('/clubes', { headers: { connection: 'keep-alive', host: 'evil', 'x-forwarded-host': 'evil' } }))
    expect(sentHeaders().get('connection')).toBeNull()
    expect(sentHeaders().get('x-forwarded-host')).toBeNull()
    expect(res.headers.get('connection')).toBeNull()
    expect(res.headers.get('x-service-token')).toBeNull()
  })

  it('não segue redirects do backend', async () => {
    await handleProxy(req('/clubes'))
    expect((upstream.mock.calls[0][1] as RequestInit).redirect).toBe('manual')
  })

  it('rejeita corpo acima do limite com 413', async () => {
    const res = await handleProxy(req('/otimizador/escalar', { method: 'POST', body: 'x'.repeat(1024 * 1024 + 1) }))
    expect(res.status).toBe(413)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('rejeita POST com Content-Length excedendo limite antes de carregar corpo na memória', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.error(new Error('não deveria tentar ler o corpo'))
      },
    })
    const r = new Request('https://app.test/api/proxy/otimizador/escalar', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(1024 * 1024 + 1),
      },
      body: stream,
      duplex: 'half',
    })
    const res = await handleProxy(r)
    expect(res.status).toBe(413)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('falha fechado em produção sem SERVICE_TOKEN', async () => {
    vi.stubEnv('SERVICE_TOKEN', '')
    const res = await handleProxy(req('/atletas'))
    expect(res.status).toBe(503)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('falha fechado sem BACKEND_ORIGIN', async () => {
    vi.stubEnv('BACKEND_ORIGIN', '')
    expect((await handleProxy(req('/atletas'))).status).toBe(503)
    expect(upstream).not.toHaveBeenCalled()
  })

  it('fora de produção sem token ainda exige origem, mas dispensa o header', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('SERVICE_TOKEN', '')
    await handleProxy(req('/atletas'))
    expect(sentHeaders().get('x-service-token')).toBeNull()
  })

  it('responde 504 em timeout e 502 em falha de rede, sem vazar detalhes', async () => {
    upstream.mockRejectedValueOnce(new DOMException('t', 'TimeoutError'))
    expect((await handleProxy(req('/atletas'))).status).toBe(504)
    upstream.mockRejectedValueOnce(new Error('ECONNREFUSED segredo-do-servidor'))
    const res = await handleProxy(req('/atletas'))
    expect(res.status).toBe(502)
    expect(await res.text()).not.toContain('segredo')
  })

  it('recupera o caminho via x-matched-path quando a URL foi reescrita para [...path]', async () => {
    const r = new Request('https://app.test/api/proxy/[...path]?pagina=1', {
      headers: { 'x-matched-path': '/api/proxy/atletas' },
    })
    const res = await handleProxy(r)
    expect(res.status).toBe(200)
    expect(upstream.mock.calls[0][0]).toBe('https://backend.test/atletas?pagina=1')
  })
})
