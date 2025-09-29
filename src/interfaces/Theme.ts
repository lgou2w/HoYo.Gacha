import {
  Theme as FluentTheme,
  teamsDarkTheme,
  teamsLightTheme,
  webDarkTheme,
  webLightTheme,
} from '@fluentui/react-components'
import OverridedFluentTheme from './Theme.override'

export const Light = 'light'
export const Dark = 'dark'
export const KnownColorSchemes = [Light, Dark] as const
export type ColorScheme = typeof Light | typeof Dark

function createColorSchemeTheme (
  [light, dark]: [FluentTheme, FluentTheme],
  font: string | null,
): Record<ColorScheme, FluentTheme> {
  if (font) {
    // Wrap font in quotes to avoid issues with spaces
    font = `'${font}', `
  }

  return {
    [Light]: {
      ...light,
      ...OverridedFluentTheme,
      ...(font ? { fontFamilyBase: font + light.fontFamilyBase } : {}),
    },
    [Dark]: {
      ...dark,
      ...OverridedFluentTheme,
      ...(font ? { fontFamilyBase: font + dark.fontFamilyBase } : {}),
    },
  }
}

export const Themes = {
  teams: [Light, Dark],
  web: [Light, Dark],
} as const

export type Namespace = keyof typeof Themes
export const KnownNamespaces = Object.keys(Themes) as Namespace[]

export type FluentThemes = Record<Namespace, ReturnType<typeof createColorSchemeTheme>>
export function createFluentThemes (font: string | null): FluentThemes {
  return {
    teams: createColorSchemeTheme([teamsLightTheme, teamsDarkTheme], font),
    web: createColorSchemeTheme([webLightTheme, webDarkTheme], font),
  }
}

// Scale level: 1.0x, 1.2x, 1.5x, 1.8x, 2.0x
// Suitable for default system scaling at high resolution
// E.g.: 2K 100% Scaling -> 20 (1.2x)
export type ScaleLevel = 16 | 20 | 24 | 28 | 32

export interface ThemeData {
  namespace: Namespace
  colorScheme: ColorScheme | null
  scale: ScaleLevel
  font: string | null
}

export const DefaultThemeData = {
  namespace: 'web',
  colorScheme: null,
  scale: 16,
  font: null,
} as const satisfies ThemeData

export interface ThemeStore {
  load (): ThemeData | Promise<ThemeData>
  save (data: Partial<ThemeData>): void | Promise<void>
}

// CSS Properties

export const VAR_BASE_FONT_SIZE = '--base-font-size'
export const DEFAULT_BASE_FONT_SIZE = `${DefaultThemeData.scale}px` as const
