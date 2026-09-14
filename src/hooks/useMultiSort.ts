import { useCallback, useMemo, useState } from 'react'

export type SortDirection = 'desc' | 'asc'

export interface SortCriterion<K extends string> {
  key: K
  direction: SortDirection
}

type Accessors<T, K extends string> = Record<K, (item: T) => number | null>

export function useMultiSort<T, K extends string>(items: T[], accessors: Accessors<T, K>) {
  const [criteria, setCriteria] = useState<SortCriterion<K>[]>([])

  const toggleSort = useCallback((key: K) => {
    setCriteria((current) => {
      const active = current.find((criterion) => criterion.key === key)
      if (!active) return [...current, { key, direction: 'desc' }]
      if (active.direction === 'desc') {
        return current.map((criterion) =>
          criterion.key === key ? { ...criterion, direction: 'asc' } : criterion,
        )
      }
      return current.filter((criterion) => criterion.key !== key)
    })
  }, [])

  const sortedItems = useMemo(() => {
    if (criteria.length === 0) return items
    return items
      .map((item, index) => ({ item, index }))
      .sort((left, right) => {
        for (const criterion of criteria) {
          const leftValue = accessors[criterion.key](left.item)
          const rightValue = accessors[criterion.key](right.item)
          // Nulls last, independente da direção: null nunca deve "vencer" um
          // valor real, então não entra na inversão de sinal do desc.
          if (leftValue === null || rightValue === null) {
            if (leftValue === rightValue) continue
            return leftValue === null ? 1 : -1
          }
          const difference = leftValue - rightValue
          if (difference !== 0) return criterion.direction === 'asc' ? difference : -difference
        }
        return left.index - right.index
      })
      .map(({ item }) => item)
  }, [accessors, criteria, items])

  return { criteria, sortedItems, toggleSort }
}
