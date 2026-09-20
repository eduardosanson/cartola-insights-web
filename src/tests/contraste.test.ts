import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/theme.css'), 'utf8')

type Tokens = Record<string, string>

/** Extrai as declarações `--token: #rrggbb` de um bloco de CSS. */
function tokensHex(bloco: string): Tokens {
  const tokens: Tokens = {}
  for (const [, nome, valor] of bloco.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[nome] = valor
  }
  return tokens
}

function blocoRaiz(): string {
  return css.match(/^:root\s*\{([\s\S]*?)^\}/m)![1]
}

function blocoEscuro(): string {
  return css.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([\s\S]*?)\}\s*\}/)![1]
}

const claro = tokensHex(blocoRaiz())
const escuro = { ...claro, ...tokensHex(blocoEscuro()) }

function canal(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}

export function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
}

/** Razão de contraste WCAG 2.x entre duas cores hex (1 a 21). */
export function razaoContraste(a: string, b: string): number {
  const [la, lb] = [luminancia(a), luminancia(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// Pares texto/fundo realmente usados na UI (theme.css / componentes).
const PARES: Array<[texto: string, fundo: string]> = [
  ['--text', '--bg'],
  ['--text', '--bg-elevated'],
  ['--text-muted', '--bg'],
  ['--text-muted', '--bg-elevated'],
  ['--accent-home', '--bg'],
  ['--accent-home', '--bg-elevated'],
  ['--accent-away', '--bg'],
  ['--accent-away', '--bg-elevated'],
  ['--danger', '--bg'],
  ['--danger', '--bg-elevated'],
]

describe('contraste WCAG 2.1 AA dos design tokens (issue #7, RF06)', () => {
  it('calcula a razão WCAG corretamente (referências conhecidas)', () => {
    expect(razaoContraste('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(razaoContraste('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
    expect(razaoContraste('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  })

  it('detecta par abaixo de 4.5:1 (CA02)', () => {
    expect(razaoContraste('#999999', '#ffffff')).toBeLessThan(4.5)
  })

  for (const [tema, tokens] of [
    ['claro', claro],
    ['escuro', escuro],
  ] as const) {
    describe(`tema ${tema}`, () => {
      it.each(PARES)('%s sobre %s ≥ 4.5:1', (texto, fundo) => {
        const razao = razaoContraste(tokens[texto], tokens[fundo])
        expect(
          razao,
          `${texto} (${tokens[texto]}) sobre ${fundo} (${tokens[fundo]}) = ${razao.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5)
      })
    })
  }
})

describe('indicador de foco visível (issue #7, CA04)', () => {
  const regras = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, corpo]) => ({
    seletor: sel.trim(),
    corpo,
  }))

  it('toda regra :focus/:focus-visible com outline:none declara indicador alternativo', () => {
    const semIndicador = regras
      .filter(({ seletor }) => /:focus(-visible)?\b/.test(seletor))
      .filter(({ corpo }) => /outline:\s*none/.test(corpo))
      .filter(({ corpo }) => !/box-shadow|stroke|outline:\s*\d/.test(corpo))
      .map(({ seletor }) => seletor)

    expect(semIndicador).toEqual([])
  })
})
