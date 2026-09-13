// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

interface VercelHeaderEntry {
  key: string
  value: string
}

interface VercelHeaderRule {
  source: string
  headers: VercelHeaderEntry[]
}

interface VercelConfig {
  rewrites?: unknown
  headers?: VercelHeaderRule[]
}

describe('vercel.json — security headers (issue #10)', () => {
  const configPath = resolve(process.cwd(), 'vercel.json')
  const config = JSON.parse(readFileSync(configPath, 'utf8')) as VercelConfig

  function headerFor(source: string, key: string): string | undefined {
    const regra = config.headers?.find((r) => r.source === source)
    return regra?.headers.find((h) => h.key === key)?.value
  }

  it('preserva o rewrite existente do SPA', () => {
    expect(config.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }])
  })

  it('aplica os headers a todas as rotas via source "/(.*)"', () => {
    const regra = config.headers?.find((r) => r.source === '/(.*)')
    expect(regra).toBeDefined()
  })

  it('define X-Frame-Options: DENY', () => {
    expect(headerFor('/(.*)', 'X-Frame-Options')).toBe('DENY')
  })

  it('define X-Content-Type-Options: nosniff', () => {
    expect(headerFor('/(.*)', 'X-Content-Type-Options')).toBe('nosniff')
  })

  it('define Referrer-Policy: strict-origin-when-cross-origin', () => {
    expect(headerFor('/(.*)', 'Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  describe('Content-Security-Policy', () => {
    const csp = headerFor('/(.*)', 'Content-Security-Policy') ?? ''

    it('está presente', () => {
      expect(csp.length).toBeGreaterThan(0)
    })

    it('restringe a origem padrão a "self" e não usa wildcard em nenhuma diretiva', () => {
      expect(csp).toContain("default-src 'self'")
      expect(csp).not.toContain('*')
    })

    it('permite Google Fonts em style-src e font-src', () => {
      expect(csp).toMatch(/style-src[^;]*fonts\.googleapis\.com/)
      expect(csp).toMatch(/font-src[^;]*fonts\.gstatic\.com/)
    })

    it('permite o backend de produção em connect-src', () => {
      expect(csp).toMatch(/connect-src[^;]*backend-production-9114\.up\.railway\.app/)
    })

    it('permite os assets Cartola/Globo em img-src', () => {
      expect(csp).toMatch(/img-src[^;]*glbimg\.com/)
    })

    it('bloqueia embutir a aplicação em iframe de terceiros via frame-ancestors', () => {
      expect(csp).toContain("frame-ancestors 'none'")
    })

    it('bloqueia plugins/objetos com object-src none', () => {
      expect(csp).toContain("object-src 'none'")
    })
  })

  it('define Permissions-Policy desabilitando recursos de hardware não usados', () => {
    const valor = headerFor('/(.*)', 'Permissions-Policy') ?? ''
    expect(valor).toContain('camera=()')
    expect(valor).toContain('microphone=()')
    expect(valor).toContain('geolocation=()')
  })

  it('define Strict-Transport-Security com includeSubDomains', () => {
    const valor = headerFor('/(.*)', 'Strict-Transport-Security') ?? ''
    expect(valor).toMatch(/max-age=\d+/)
    expect(valor).toContain('includeSubDomains')
  })
})
