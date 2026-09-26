import { describe, it, expect } from 'vitest'
import viteConfig from '../vite.config'

describe('vite.config proxy', () => {
  it('configura proxy para /api/proxy com target, changeOrigin e rewrite', () => {
    const serverProxy = (viteConfig as unknown as { server?: { proxy?: Record<string, { rewrite: (p: string) => string; changeOrigin: boolean }> } }).server?.proxy?.['/api/proxy']
    expect(serverProxy).toBeDefined()
    expect(typeof serverProxy).toBe('object')
    expect(serverProxy?.rewrite).toBeDefined()
    expect(serverProxy?.rewrite('/api/proxy/clubes')).toBe('/clubes')
    expect(serverProxy?.changeOrigin).toBe(true)
  })
})
