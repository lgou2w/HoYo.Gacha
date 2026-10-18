import { describe, expect, it } from 'vitest'
import capitalize from '@/utilities/capitalize'

describe('capitalize', () => {
  it('uppercases only the first character', () => {
    expect(capitalize('hello')).toBe('Hello')
    expect(capitalize('hello world')).toBe('Hello world')
    expect(capitalize('hELLO')).toBe('HELLO')
  })

  it('leaves a leading digit alone', () => {
    expect(capitalize('123abc')).toBe('123abc')
  })

  it('handles empty string', () => {
    expect(capitalize('')).toBe('')
  })

  it('returns null for null and undefined for undefined', () => {
    expect(capitalize(null)).toBeNull()
    expect(capitalize(undefined)).toBeUndefined()
  })
})
