import { describe, expect, it } from 'vitest'
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
})
