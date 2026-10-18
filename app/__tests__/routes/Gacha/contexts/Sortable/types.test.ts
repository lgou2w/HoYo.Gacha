import { describe, expect, it } from 'vitest'
import { mergeVisibleOrder } from '@/routes/Gacha/contexts/Sortable/types'

describe('mergeVisibleOrder', () => {
  it('replaces only the visible slots, keeping hidden items in place', () => {
    // Visible items live at positions [0, 2, 4] of `full`.
    // New visible order [e, c, a] reassigns those slots.
    expect(mergeVisibleOrder(['a', 'b', 'c', 'd', 'e'], ['e', 'c', 'a']))
      .toEqual(['e', 'b', 'c', 'd', 'a'])
  })

  it('is a no-op when the visible order matches the full order', () => {
    expect(mergeVisibleOrder(['a', 'b', 'c'], ['a', 'c']))
      .toEqual(['a', 'b', 'c'])
  })

  it('handles empty inputs', () => {
    expect(mergeVisibleOrder(['a', 'b', 'c'], [])).toEqual(['a', 'b', 'c'])
    expect(mergeVisibleOrder([], [])).toEqual([])
  })

  it('does not validate that visible ids belong to full', () => {
    // Unknown ids still consume a slot; callers must ensure a valid subset.
    expect(mergeVisibleOrder(['a', 'b'], ['x', 'b'])).toEqual(['a', 'x'])
  })
})
