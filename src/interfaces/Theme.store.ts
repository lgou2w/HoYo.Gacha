import { findKv, upsertKv } from '@/api/commands/database'
import { DefaultThemeData, ThemeData, ThemeStore, Themes } from './Theme'

export type { ThemeStore }

// See: src-tauri/src/consts.rs
export const KEY = 'HG_THEME_DATA'

export class LocalStorageThemeStore implements ThemeStore {
  load (): ThemeData | Promise<ThemeData> {
    const data: ThemeData = { ...DefaultThemeData }

    const dirty = window.localStorage.getItem(KEY)
    if (!dirty) {
      console.debug('Using default theme data:', data)
      return data
    }

    let parsed: Partial<ThemeData>
    try {
      parsed = JSON.parse(dirty)
    } catch (e) {
      console.error(`Invalid localStorage theme data: ${dirty}`, e)
      window.localStorage.removeItem(KEY)
      return data
    }

    const { namespace, colorScheme, scale } = parsed
    const invalid = !namespace || !colorScheme || !Themes[namespace]?.[colorScheme]
    if (invalid) {
      console.error(
        'Invalid localStorage theme namespace or color scheme: namespace=%s, colorScheme=%s',
        namespace,
        colorScheme,
      )
      window.localStorage.removeItem(KEY)
      return data
    }

    data.namespace = namespace
    data.colorScheme = colorScheme
    data.scale = scale || data.scale

    console.debug('Loaded localStorage theme data:', data)
    return data
  }

  save (data: ThemeData): void | Promise<void> {
    const stringifyData = JSON.stringify(data)
    window.localStorage.setItem(KEY, stringifyData)
    console.debug('Saved localStorage theme data:', data)
  }
}

export class DatabaseThemeStore implements ThemeStore {
  async load (): Promise<ThemeData> {
    console.debug('Loading theme data from database...')
    const kv = await findKv({ key: KEY })

    if (!kv) {
      return { ...DefaultThemeData }
    } else {
      return JSON.parse(kv.val) // FIXME: UNSAFE
    }
  }

  async save (data: ThemeData): Promise<void> {
    console.debug('Saving theme data to database...')
    const val = JSON.stringify(data)
    await upsertKv({ key: KEY, val })
  }
}
