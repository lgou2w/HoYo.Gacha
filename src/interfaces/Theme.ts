import {
  Theme as FluentTheme,
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

export const Themes = {
  teams: createColorSchemeTheme([teamsLightTheme, teamsDarkTheme]),
  web: createColorSchemeTheme([webLightTheme, webDarkTheme])
} as const

export type Namespace = keyof typeof Themes
export const KnownNamespaces = Object.keys(Themes) as Namespace[]

// Scale level: 1.0x, 1.2x, 1.5x, 1.8x, 2.0x
// Suitable for default system scaling at high resolution
// E.g.: 2K 100% Scaling -> 20 (1.2x)
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
