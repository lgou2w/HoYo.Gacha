import { deleteKv, findKv, upsertKv } from '@/api/commands/database'
import { DefaultThemeData, ThemeData, ThemeStore, Themes } from './Theme'

export type { ThemeStore }

// See: src-tauri/src/consts.rs
export const KEY = 'HG_THEME_DATA'

export class LocalStorageThemeStore implements ThemeStore {
  load = loadAndEvaluateThemeData.bind(null, {
    name: LocalStorageThemeStore.name,
    dirty: () => globalThis.localStorage.getItem(KEY),
    invalidate: () => globalThis.localStorage.removeItem(KEY),
  })

  save (data: Partial<ThemeData>): void | Promise<void> {
    const stringifyData = JSON.stringify(data)
    window.localStorage.setItem(KEY, stringifyData)
    console.debug('Saved localStorage theme data:', data)
  }
}

export class DatabaseThemeStore implements ThemeStore {
  load = loadAndEvaluateThemeData.bind(null, {
    name: DatabaseThemeStore.name,
    dirty: () => findKv({ key: KEY }).then((kv) => kv?.val),
    invalidate: () => deleteKv({ key: KEY }),
  })

  async save (data: Partial<ThemeData>): Promise<void> {
    console.debug('Saving theme data to database...')
    const val = JSON.stringify(data)
    await upsertKv({ key: KEY, val })
  }
}

async function loadAndEvaluateThemeData (engine: {
  readonly name: string
  dirty: () => string | undefined | null | Promise<string | undefined | null>
  invalidate: () => unknown | Promise<unknown>
}): Promise<ThemeData> {
  console.debug(`Loading theme data from ${engine.name}...`)

  const data: ThemeData = { ...DefaultThemeData }
  const dirty = await engine.dirty()

  if (!dirty) {
    console.debug('Using default theme data:', data)
    return data
  }

  let parsed: Partial<ThemeData>
  try {
    parsed = JSON.parse(dirty)
  } catch (error) {
    console.error(`Invalid ${engine.name} theme data: ${dirty}`, error)
    await engine.invalidate()
    return data
  }

  const { namespace, colorScheme, scale, font } = parsed
  const invalid = !namespace || !colorScheme || !Themes[namespace]?.includes(colorScheme)
  if (invalid) {
    console.error(
      `Invalid ${engine.name} theme namespace or color scheme: namespace=%s, colorScheme=%s`,
      namespace,
      colorScheme,
    )

    await engine.invalidate()
    return data
  }

  data.namespace = namespace
  data.colorScheme = colorScheme
  data.scale = scale || data.scale
  data.font = font || data.font

  console.debug(`Loaded ${engine.name} theme data:`, data)
  return data
}
