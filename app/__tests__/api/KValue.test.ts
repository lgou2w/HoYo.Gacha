// @vitest-environment jsdom
/* eslint-disable import-x/order */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/invoke', () => ({ default: vi.fn() }))
vi.mock('@tauri-apps/api/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tauri-apps/api/core')>()),
  isTauri: vi.fn(() => true),
}))

import { isTauri } from '@tauri-apps/api/core'
import { createKValueStore } from '@/api/KValue'
import invoke from '@/api/invoke'

const mockedInvoke = vi.mocked(invoke) as unknown as ReturnType<typeof vi.fn>

describe('createKValueStore', () => {
  beforeEach(() => {
    vi.mocked(isTauri).mockReturnValue(true)
    mockedInvoke.mockReset()
    localStorage.clear()
  })

  afterEach(() => {
    vi.mocked(isTauri).mockReset()
  })

  it('uses the database key + backend when in Tauri', async () => {
    mockedInvoke.mockResolvedValue({ key: 'DB_K', val: 'stored', updatedAt: '' })

    const store = createKValueStore({ database: 'DB_K', localStorage: 'LS_K' })
    expect(store.key).toBe('DB_K')

    await expect(store.read()).resolves.toBe('stored')
    expect(mockedInvoke).toHaveBeenCalledWith('database_find_kvalue', { key: 'DB_K' })
  })

  it('writes / clears through the database backend', async () => {
    mockedInvoke.mockResolvedValue({ key: 'DB_K', val: 'x', updatedAt: '' })
    const store = createKValueStore({ database: 'DB_K', localStorage: 'LS_K' })

    await store.write('hello')
    expect(mockedInvoke).toHaveBeenCalledWith('database_upsert_kvalue', { key: 'DB_K', val: 'hello' })

    await store.clear()
    expect(mockedInvoke).toHaveBeenCalledWith('database_delete_kvalue', { key: 'DB_K' })
  })

  it('returns null when the database has no row', async () => {
    mockedInvoke.mockResolvedValueOnce(null)
    const store = createKValueStore({ database: 'DB_K', localStorage: 'LS_K' })
    await expect(store.read()).resolves.toBeNull()
  })

  it('uses the localStorage key + backend outside Tauri', async () => {
    vi.mocked(isTauri).mockReturnValue(false)

    const store = createKValueStore({ database: 'DB_K', localStorage: 'LS_K' })
    expect(store.key).toBe('LS_K')

    expect(store.read()).toBeNull()

    store.write('hello')
    expect(localStorage.getItem('LS_K')).toBe('hello')
    expect(store.read()).toBe('hello')

    store.clear()
    expect(localStorage.getItem('LS_K')).toBeNull()
    expect(store.read()).toBeNull()
  })
})
