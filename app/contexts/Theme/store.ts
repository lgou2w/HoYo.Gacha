import { KeyValuePairCommands } from '@/api/schemas/KeyValuePair'
import { DefaultThemeData, ThemeData } from './theme'

export interface ThemeStore {
  load (): ThemeData | Promise<ThemeData>
  save (data: Partial<ThemeData>): void | Promise<void>
}

// Implements

const KEY = 'HG_THEME_DATA'

// Theme store using browser localStorage
export class LocalStorageThemeStore implements ThemeStore {
  load = loadAndEvaluateThemeData.bind(null, {
    name: LocalStorageThemeStore.name,
    dirty: () => window.localStorage.getItem(KEY),
    invalidate: () => window.localStorage.removeItem(KEY),
  })

  save (data: Partial<ThemeData>): void | Promise<void> {
    const stringifyData = JSON.stringify(data)
    window.localStorage.setItem(KEY, stringifyData)
    console.debug('Saved localStorage theme data:', data)
  }
}

// Theme store using application database
export class DatabaseThemeStore implements ThemeStore {
  load = loadAndEvaluateThemeData.bind(null, {
    name: DatabaseThemeStore.name,
    dirty: () => KeyValuePairCommands.find({ key: KEY }).then((kv) => kv?.val),
    invalidate: () => KeyValuePairCommands.delete({ key: KEY }),
  })

  async save (data: Partial<ThemeData>): Promise<void> {
    console.debug('Saving database theme data:', data)
    const val = JSON.stringify(data)
    await KeyValuePairCommands.upsert({ key: KEY, val })
  }
}

// Load and evaluate theme data from the given engine
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

  // Parse theme data
  let parsed: Partial<ThemeData>
  try {
    parsed = JSON.parse(dirty)
  } catch (error) {
    console.error(`Invalid ${engine.name} theme data: ${dirty}`, error)
    await engine.invalidate()
    return data
  }

  // Validate theme data
  const { namespace, colorScheme, scale, font } = parsed
  if (!namespace) {
    console.error(`Invalid ${engine.name} theme namespace:`, namespace)
    await engine.invalidate()
    return data
  }

  // Apply valid theme data
  data.namespace = namespace
  data.colorScheme = colorScheme || data.colorScheme
  data.scale = scale || data.scale
  data.font = font || data.font

  console.debug(`Loaded ${engine.name} theme data:`, data)
  return data
}
