import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMultiSort } from './useMultiSort'

interface Item {
  id: number
  casa: number
  fora: number
}

const items: Item[] = [
  { id: 1, casa: 4.574, fora: 2 },
  { id: 2, casa: 4.571, fora: 8 },
  { id: 3, casa: 3, fora: 5 },
]

const accessors = {
  casa: (item: Item) => item.casa,
  fora: (item: Item) => item.fora,
}

describe('useMultiSort', () => {
  it('returns the exact same items reference when no criteria are active', () => {
    const { result } = renderHook(() => useMultiSort(items, accessors))

    expect(result.current.criteria).toEqual([])
    expect(result.current.sortedItems).toBe(items)
  })

  it('keeps the toggleSort function reference stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useMultiSort(items, accessors))

    const firstToggleSort = result.current.toggleSort
    rerender()
    expect(result.current.toggleSort).toBe(firstToggleSort)
  })

  it('cycles a criterion through desc, asc and removed', () => {
    const { result } = renderHook(() => useMultiSort(items, accessors))

    act(() => result.current.toggleSort('casa'))
    expect(result.current.criteria).toEqual([{ key: 'casa', direction: 'desc' }])
    expect(result.current.sortedItems.map((item) => item.id)).toEqual([1, 2, 3])

    act(() => result.current.toggleSort('casa'))
    expect(result.current.criteria).toEqual([{ key: 'casa', direction: 'asc' }])
    expect(result.current.sortedItems.map((item) => item.id)).toEqual([3, 2, 1])

    act(() => result.current.toggleSort('casa'))
    expect(result.current.criteria).toEqual([])
    expect(result.current.sortedItems.map((item) => item.id)).toEqual([1, 2, 3])
  })

  it('combines criteria in click order and keeps raw numeric precision', () => {
    const tiedItems = [
      { id: 1, casa: 4.574, fora: 2 },
      { id: 2, casa: 4.571, fora: 8 },
      { id: 3, casa: 3, fora: 5 },
      { id: 4, casa: 4.574, fora: 9 },
    ]
    const { result } = renderHook(() => useMultiSort(tiedItems, accessors))

    act(() => result.current.toggleSort('casa'))
    act(() => result.current.toggleSort('fora'))

    expect(result.current.criteria).toEqual([
      { key: 'casa', direction: 'desc' },
      { key: 'fora', direction: 'desc' },
    ])
    expect(result.current.sortedItems.map((item) => item.id)).toEqual([4, 1, 2, 3])
  })
})
