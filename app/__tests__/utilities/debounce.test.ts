// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import debounce from '@/utilities/debounce'

// `debounce` requires `(...args: readonly unknown[]) => unknown`; helpers below
// bridge concrete signatures into it without touching the production code.
type AnyFunction = (...args: readonly unknown[]) => unknown

const asAnyFunction = <T>(fn: T): AnyFunction => fn as unknown as AnyFunction

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('delays invocation by `wait` ms and passes the latest args', () => {
    const fn = vi.fn<(a: string, b: number) => void>()
    const debounced = debounce(asAnyFunction(fn), 100)

    debounced('a', 1)
    debounced('b', 2)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('b', 2)
  })

  it('exposes `isPending`', () => {
    const debounced = debounce(() => { /* empty */ }, 100)
    expect(debounced.isPending).toBe(false)

    debounced()
    expect(debounced.isPending).toBe(true)

    vi.advanceTimersByTime(100)
    expect(debounced.isPending).toBe(false)
  })

  it('runs immediately when `immediate: true` and returns the result', () => {
    const callback = (n: number) => n * 2
    const debounced = debounce(asAnyFunction(callback), 100, { immediate: true })
    expect(debounced(21)).toBe(42)
    expect(debounced.isPending).toBe(true)
  })

  it('clear() cancels the pending call', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    debounced.clear()
    expect(debounced.isPending).toBe(false)

    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()
  })

  it('flush() runs the pending call immediately', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    debounced.flush()
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('a')
    expect(debounced.isPending).toBe(false)
  })

  it('trigger() runs and clears without waiting', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced('a')
    debounced.trigger()
    expect(fn).toHaveBeenCalledOnce()
    expect(debounced.isPending).toBe(false)
  })

  it('rejects a negative wait', () => {
    expect(() => debounce(() => { /* empty */ }, -1)).toThrow(RangeError)
  })

  it('rejects a non-function', () => {
    expect(() => debounce(null as never)).toThrow(TypeError)
  })

  it('throws when reused from a different `this` of the same prototype', () => {
    class A { run = debounce(function (this: unknown) { /* empty */ }, 100) }
    const a1 = new A()
    const a2 = new A()

    a1.run()
    // Same prototype, different instance, previous call still pending.
    expect(() => a1.run.call(a2)).toThrow(/already running in a different context/)
  })
})
