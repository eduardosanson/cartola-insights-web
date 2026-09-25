const PREFIX = '/api/proxy'
const MAX_BODY_BYTES = 1024 * 1024
const TIMEOUT_MS = 15_000

const ID = '\\d+'
const ROUTES: Record<string, RegExp[]> = {
  GET: [
    '/atletas', `/atletas/${ID}`, `/atletas/${ID}/historico`, `/atletas/${ID}/percentis`, `/atletas/${ID}/perfil-risco`,
    `/atletas/${ID}/raio-x`, `/atletas/${ID}/mpv`, '/clubes', '/mercado/status-alterados', '/mercado/curva-valorizacao',
    '/otimizador/esquemas', '/otimizador/matriz-capitao', `/otimizador/substituto/${ID}`, '/contas/me', '/contas/tokens',
  ].map((p) => new RegExp(`^${p}$`)),
  POST: ['/otimizador/escalar', '/contas/registro', '/contas/login', '/contas/logout', '/contas/tokens'].map((p) => new RegExp(`^${p}$`)),
  DELETE: [new RegExp(`^/contas/tokens/${ID}$`)],
}

// Only these browser headers reach the backend; everything else (host, hop-by-hop, x-service-token) is dropped.
const FORWARDED_REQUEST_HEADERS = ['cookie', 'content-type', 'accept', 'accept-language']
const DROPPED_RESPONSE_HEADERS = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'te', 'trailer', 'proxy-authenticate', 'proxy-authorization', 'content-encoding', 'content-length', 'x-service-token']

export function matchRoute(method: string, path: string): boolean {
  return ROUTES[method]?.some((re) => re.test(path)) ?? false
}

const erro = (status: number, code: string) => Response.json({ code }, { status })

export async function handleProxy(request: Request): Promise<Response> {
  const method = request.method.toUpperCase()
  if (!(method in ROUTES)) return erro(405, 'method_not_allowed')

  const origin = process.env.BACKEND_ORIGIN
  const token = process.env.SERVICE_TOKEN
  if (!origin || (!token && process.env.NODE_ENV === 'production')) return erro(503, 'proxy_not_configured')

  const url = new URL(request.url)
  // Match against the raw pathname: no decoding, so %2e%2e, backslashes and // never reach an allowed pattern.
  const path = url.pathname.startsWith(PREFIX) ? url.pathname.slice(PREFIX.length) : ''
  if (!matchRoute(method, path)) return erro(404, 'route_not_allowed')

  let body: ArrayBuffer | undefined
  if (method === 'POST') {
    body = await request.arrayBuffer()
    if (body.byteLength > MAX_BODY_BYTES) return erro(413, 'payload_too_large')
  }

  const headers = new Headers()
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  if (token) headers.set('x-service-token', token)

  let upstream: Response
  try {
    upstream = await fetch(`${origin.replace(/\/+$/, '')}${path}${url.search}`, {
      method,
      headers,
      body,
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (cause) {
    return (cause as Error).name === 'TimeoutError' ? erro(504, 'upstream_timeout') : erro(502, 'upstream_unreachable')
  }

  const out = new Headers()
  upstream.headers.forEach((value, name) => {
    if (name !== 'set-cookie' && !DROPPED_RESPONSE_HEADERS.includes(name)) out.set(name, value)
  })
  for (const cookie of upstream.headers.getSetCookie()) out.append('set-cookie', cookie)
  return new Response(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: out })
}
