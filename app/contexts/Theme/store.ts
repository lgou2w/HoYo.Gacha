import { createKValueStore } from '@/api/KValue'
import { DefaultThemeData, ThemeData } from './types'

export interface ThemeStore {
  load (): ThemeData | Promise<ThemeData>
  save (updated: Partial<ThemeData>): void | Promise<void>
}

// See tauri/src/bootstrap/context.rs
export const THEME_DATA_KEY = 'HG_THEME_DATA'

export function createThemeStore (key = THEME_DATA_KEY): ThemeStore {
  const kv = createKValueStore({
    database: key,
    localStorage: key,
  })

  return {
    async load () {
      console.debug('[ThemeStore] loading theme data...')

      const fallback: ThemeData = { ...DefaultThemeData }
      const raw = await kv.read()
      if (!raw) {
        return fallback
      }

      let parsed: Partial<ThemeData>
      try {
        parsed = JSON.parse(raw)
      } catch (error) {
        console.error(`[ThemeStore] invalid theme data: ${raw}`, error)
        await kv.clear()
        return fallback
      }

      if (!parsed.namespace) {
        console.error('[ThemeStore] invalid theme namespace:', parsed.namespace)
        await kv.clear()
        return fallback
      }

      return {
        namespace: parsed.namespace,
        colorScheme: parsed.colorScheme || fallback.colorScheme,
        scale: parsed.scale || fallback.scale,
        font: parsed.font || fallback.font,
      }
    },
    async save (updated) {
      console.debug('[ThemeStore] save theme data:', updated)
      await kv.write(JSON.stringify(updated))
    },
  }
}
