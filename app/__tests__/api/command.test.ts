/* eslint-disable import-x/order */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/invoke', () => ({ default: vi.fn() }))

import { declareCommand } from '@/api/command'
import invoke from '@/api/invoke'

const mockedInvoke = vi.mocked(invoke) as unknown as ReturnType<typeof vi.fn>

describe('declareCommand', () => {
  beforeEach(() => {
    mockedInvoke.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('forwards arguments to invoke and returns its result', async () => {
    mockedInvoke.mockResolvedValueOnce('ok')
    const cmd = declareCommand<{ x: number }, string>('cmd_a')

    await expect(cmd({ x: 1 })).resolves.toBe('ok')
    expect(mockedInvoke).toHaveBeenCalledWith('cmd_a', { x: 1 })
  })

  it('propagates the invoke rejection', async () => {
    mockedInvoke.mockRejectedValueOnce(new Error('boom'))
    const cmd = declareCommand('cmd_b')

    await expect(cmd(undefined)).rejects.toThrow('boom')
  })
})

describe('declareCommand({ once: true })', () => {
  beforeEach(() => {
    mockedInvoke.mockReset()
  })

  it('executes invoke only once and caches the resolved value', async () => {
    mockedInvoke.mockResolvedValue('value')
    const cmd = declareCommand<{ x: number }, string>('cmd_once_a', { once: true })

    expect(cmd.initialized).toBe(false)

    const a = await cmd({ x: 1 })
    const b = await cmd({ x: 2 })

    expect(a).toBe('value')
    expect(b).toBe('value')
    expect(mockedInvoke).toHaveBeenCalledOnce()
    expect(mockedInvoke).toHaveBeenCalledWith('cmd_once_a', { x: 1 })
    expect(cmd.initialized).toBe(true)
  })

  it('returns the same promise for concurrent calls', async () => {
    let resolve!: (v: string) => void
    mockedInvoke.mockImplementationOnce(() => new Promise<string>((r) => {
      resolve = r
    }))

    const cmd = declareCommand<{ x: number }, string>('cmd_once_b', { once: true })
    const p1 = cmd({ x: 1 })
    const p2 = cmd({ x: 2 })

    expect(p1).toBe(p2)
    resolve('value')
    await expect(p1).resolves.toBe('value')
    await expect(p2).resolves.toBe('value')
    expect(mockedInvoke).toHaveBeenCalledOnce()
  })

  it('resets state on failure so the next call can retry', async () => {
    mockedInvoke
      .mockRejectedValueOnce(new Error('first'))
      .mockResolvedValueOnce('second')

    const cmd = declareCommand<{ x: number }, string>('cmd_once_c', { once: true })

    await expect(cmd({ x: 1 })).rejects.toThrow(/Command "cmd_once_c" execution failed/)
    expect(cmd.initialized).toBe(false)

    await expect(cmd({ x: 2 })).resolves.toBe('second')
    expect(cmd.initialized).toBe(true)
    expect(mockedInvoke).toHaveBeenCalledTimes(2)
    expect(mockedInvoke).toHaveBeenNthCalledWith(1, 'cmd_once_c', { x: 1 })
    expect(mockedInvoke).toHaveBeenNthCalledWith(2, 'cmd_once_c', { x: 2 })
  })

  it('preserves the original error as `cause`', async () => {
    const original = new Error('inner')
    mockedInvoke.mockRejectedValueOnce(original)

    const cmd = declareCommand('cmd_once_e', { once: true })
    const err = await cmd(undefined).catch((e) => e)

    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toMatch(/Command "cmd_once_e" execution failed: inner/)
    expect((err as Error).cause).toBe(original)
  })

  it('reset() clears the cache', async () => {
    mockedInvoke.mockResolvedValue('v')
    const cmd = declareCommand<{ x: number }, string>('cmd_once_d', { once: true })

    await cmd({ x: 1 })
    expect(cmd.initialized).toBe(true)

    cmd.reset()
    expect(cmd.initialized).toBe(false)

    await cmd({ x: 2 })
    expect(mockedInvoke).toHaveBeenCalledTimes(2)
  })
})
