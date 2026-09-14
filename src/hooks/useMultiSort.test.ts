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

  it('keeps items with a null accessor value last in descending order', () => {
    interface ItemComNulo {
      id: number
      chance: number | null
    }
    const itensComNulo: ItemComNulo[] = [
      { id: 1, chance: 80 },
      { id: 2, chance: null },
      { id: 3, chance: 95 },
    ]
    const accessorsComNulo = { chance: (item: ItemComNulo) => item.chance }
    const { result } = renderHook(() => useMultiSort(itensComNulo, accessorsComNulo))

    act(() => result.current.toggleSort('chance'))

    expect(result.current.criteria).toEqual([{ key: 'chance', direction: 'desc' }])
    expect(result.current.sortedItems.map((item) => item.id)).toEqual([3, 1, 2])
  })

  it('keeps items with a null accessor value last in ascending order too', () => {
    interface ItemComNulo {
      id: number
      chance: number | null
    }
    const itensComNulo: ItemComNulo[] = [
      { id: 1, chance: 80 },
      { id: 2, chance: null },
      { id: 3, chance: 95 },
    ]
    const accessorsComNulo = { chance: (item: ItemComNulo) => item.chance }
    const { result } = renderHook(() => useMultiSort(itensComNulo, accessorsComNulo))

    act(() => result.current.toggleSort('chance'))
    act(() => result.current.toggleSort('chance'))

    expect(result.current.criteria).toEqual([{ key: 'chance', direction: 'asc' }])
    expect(result.current.sortedItems.map((item) => item.id)).toEqual([1, 3, 2])
  })

  it('treats two null accessor values as tied, falling back to the next criterion', () => {
    interface ItemComNulo {
      id: number
      chance: number | null
      preco: number
    }
    const itensComNulo: ItemComNulo[] = [
      { id: 1, chance: null, preco: 5 },
      { id: 2, chance: 90, preco: 3 },
      { id: 3, chance: null, preco: 1 },
    ]
    const accessorsComNulo = {
      chance: (item: ItemComNulo) => item.chance,
      preco: (item: ItemComNulo) => item.preco,
    }
    const { result } = renderHook(() => useMultiSort(itensComNulo, accessorsComNulo))

    act(() => result.current.toggleSort('chance'))
    act(() => result.current.toggleSort('preco'))

    // item 2 (não-nulo) vem primeiro; entre os empatados em null, preco desc
    // (item 1 = 5 > item 3 = 1) decide o desempate.
    expect(result.current.sortedItems.map((item) => item.id)).toEqual([2, 1, 3])
  })
})
