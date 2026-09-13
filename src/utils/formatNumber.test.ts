import { describe, expect, it, vi } from 'vitest'
import { formatCurrency, formatDecimal, formatInteger, formatNumber, formatPercent } from './formatNumber'

describe('formatNumber', () => {
  it.each([
    [4, '4'],
    [4.5, '4,5'],
    [4.57, '4,57'],
    [4.578, '4,58'],
    [-0.806, '-0,81'],
  ])('formats %s with at most two decimal places', (value, expected) => {
    expect(formatNumber(value)).toBe(expected)
  })

  it.each([null, undefined, Number.NaN])('formats %s as em dash', (value) => {
    expect(formatNumber(value)).toBe('—')
  })

  it('uses pt-BR grouping (thousands separator) and decimal comma', () => {
    // '.' as thousands separator and ',' as decimal separator only happen with
    // the 'pt-BR' locale; an empty/invalid locale would throw or fall back to
    // a different grouping/decimal convention (e.g. '1,234.5').
    expect(formatNumber(1234.5)).toBe('1.234,5')
  })
})

describe('formatCurrency', () => {
  it('formats a value with exactly two decimal places and the cartoletas prefix', () => {
    expect(formatCurrency(4)).toBe('C$ 4,00')
  })

  it('rounds to two decimal places', () => {
    expect(formatCurrency(4.567)).toBe('C$ 4,57')
  })

  it.each([null, undefined, Number.NaN])('formats %s as em dash', (value) => {
    expect(formatCurrency(value)).toBe('—')
  })

  it('uses pt-BR grouping (thousands separator) and decimal comma', () => {
    expect(formatCurrency(1234.5)).toBe('C$ 1.234,50')
  })
})

describe('formatPercent', () => {
  it.each([
    [80, '80%'],
    [12.4, '12,4%'],
    [70.5, '70,5%'],
    [70.45, '70,5%'],
    [0, '0%'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatPercent(value)).toBe(expected)
  })

  it.each([null, undefined, Number.NaN])('formats %s as em dash', (value) => {
    expect(formatPercent(value)).toBe('—')
  })

  it('uses pt-BR grouping (thousands separator) and decimal comma', () => {
    expect(formatPercent(1234.5)).toBe('1.234,5%')
  })
})

describe('formatInteger', () => {
  it.each([
    [4, '4'],
    [4.4, '4'],
    [4.5, '5'],
    [1234, '1.234'],
    [-12.9, '-13'],
  ])('formats %s as %s', (value, expected) => {
    expect(formatInteger(value)).toBe(expected)
  })

  it.each([null, undefined, Number.NaN])('formats %s as em dash', (value) => {
    expect(formatInteger(value)).toBe('—')
  })
})

describe('formatDecimal', () => {
  it.each([
    [4, 1, '4,0'],
    [4.56, 1, '4,6'],
    [4.04, 1, '4,0'],
    [-0.06, 1, '-0,1'],
  ])('formats %s with %s decimal place(s) as %s', (value, decimals, expected) => {
    expect(formatDecimal(value, decimals)).toBe(expected)
  })

  it('defaults to one decimal place', () => {
    expect(formatDecimal(4.56)).toBe('4,6')
  })

  it.each([null, undefined, Number.NaN])('formats %s as em dash', (value) => {
    expect(formatDecimal(value)).toBe('—')
  })

  it('reuses the cached Intl.NumberFormat instance for a decimals value already seen', () => {
    // Use a `decimals` value not exercised by any other test in this file, so the
    // internal cache is guaranteed empty for it when this test runs.
    const decimals = 9
    const OriginalNumberFormat = Intl.NumberFormat
    const spy = vi.spyOn(Intl, 'NumberFormat').mockImplementation(function (...args: ConstructorParameters<typeof Intl.NumberFormat>) {
      return new OriginalNumberFormat(...args)
    })

    formatDecimal(1, decimals)
    formatDecimal(2, decimals)
    formatDecimal(3, decimals)

    // A fresh Intl.NumberFormat must be constructed only once (cache miss on the
    // first call); subsequent calls with the same `decimals` must hit the cache
    // instead of constructing (and storing) a new formatter every time.
    expect(spy).toHaveBeenCalledTimes(1)

    spy.mockRestore()
  })
})
