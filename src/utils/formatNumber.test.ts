import { describe, expect, it } from 'vitest'
import { formatNumber } from './formatNumber'

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
})
