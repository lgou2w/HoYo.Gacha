import { describe, expect, it } from 'vitest'
import { Clientarea, Clientareas, isClientarea } from '@/routes/Gacha/contexts/Clientarea/types'

describe('Clientarea', () => {
  it('defines the three tabs', () => {
    expect(Clientarea.Overview).toBe('Overview')
    expect(Clientarea.Analysis).toBe('Analysis')
    expect(Clientarea.Chart).toBe('Chart')
  })
})

describe('Clientareas', () => {
  it('lists all tab values', () => {
    expect(Clientareas).toEqual(['Overview', 'Analysis', 'Chart'])
  })
})

describe('isClientarea', () => {
  it('accepts known values', () => {
    expect(isClientarea('Overview')).toBe(true)
    expect(isClientarea('Analysis')).toBe(true)
    expect(isClientarea('Chart')).toBe(true)
  })

  it('rejects unknown values and non-strings', () => {
    expect(isClientarea('overview')).toBe(false)
    expect(isClientarea('')).toBe(false)
    expect(isClientarea(null)).toBe(false)
    expect(isClientarea(undefined)).toBe(false)
    expect(isClientarea(0)).toBe(false)
  })
})
