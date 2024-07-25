import {
  BrandVariants,
  Theme as FluentTheme,
  createDarkTheme,
  createLightTheme,
  teamsDarkTheme,
  teamsLightTheme,
  webDarkTheme,
  webLightTheme
} from '@fluentui/react-components'
import OverridedFluentTheme from './Theme.override'

export const Light = 'light'
export const Dark = 'dark'
export const KnownColorSchemes = [Light, Dark] as const
export type ColorScheme = typeof Light | typeof Dark

export function createColorSchemeTheme (
  [light, dark]: [FluentTheme, FluentTheme]
): Record<ColorScheme, FluentTheme> {
  return {
    [Light]: { ...light, ...OverridedFluentTheme },
    [Dark]: { ...dark, ...OverridedFluentTheme }
  }
}

export function createColorSchemeThemeByBrandVariants (variants: BrandVariants) {
  return createColorSchemeTheme([
    createLightTheme(variants),
    createDarkTheme(variants)
  ])
}

export const Themes = {
  teams: createColorSchemeTheme([teamsLightTheme, teamsDarkTheme]),
  web: createColorSchemeTheme([webLightTheme, webDarkTheme]),
  vibrancy: createColorSchemeThemeByBrandVariants({
    10: '#030303',
    20: '#171717',
    30: '#252525',
    40: '#313131',
    50: '#3D3D3D',
    60: '#494949',
    70: '#565656',
    80: '#636363',
    90: '#717171',
    100: '#7F7F7F',
    110: '#8D8D8D',
    120: '#9B9B9B',
    130: '#AAAAAA',
    140: '#B9B9B9',
    150: '#C8C8C8',
    160: '#D7D7D7'
  })
} as const

export type Namespace = keyof typeof Themes
export const KnownNamespaces = Object.keys(Themes) as Namespace[]

// Scale level: 1.0x, 1.2x, 1.5x, 1.8x, 2.0x
export type ScaleLevel = 16 | 20 | 24 | 28 | 32

export interface ThemeData {
  namespace: Namespace
  colorScheme: ColorScheme
  scale: ScaleLevel
}

export const DefaultThemeData: Readonly<ThemeData> = {
  namespace: 'web',
  colorScheme: 'light',
  scale: 16
}

export interface ThemeStore {
  load (): ThemeData | Promise<ThemeData>
  save (data: ThemeData): void | Promise<void>
}

export class LocalStorageThemeStore implements ThemeStore {
  private readonly KEY = 'HG_THEME_DATA'

  load (): ThemeData | Promise<ThemeData> {
    const data: ThemeData = { ...DefaultThemeData }

    const dirty = window.localStorage.getItem(this.KEY)
    if (!dirty) {
      console.debug('Using default theme data:', data)
      return data
    }

    let parsed: Partial<ThemeData>
    try {
      parsed = JSON.parse(dirty)
    } catch (e) {
      console.error(`Invalid localStorage theme data: ${dirty}`, e)
      window.localStorage.removeItem(this.KEY)
      return data
    }

    const { namespace, colorScheme, scale } = parsed
    const invalid = !namespace || !colorScheme || !Themes[namespace]?.[colorScheme]
    if (invalid) {
      console.error(
        'Invalid localStorage theme namespace or color scheme: namespace=%s, colorScheme=%s',
        namespace,
        colorScheme
      )
      window.localStorage.removeItem(this.KEY)
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
    window.localStorage.setItem(this.KEY, stringifyData)
    console.debug('Saved localStorage theme data:', data)
  }
}
