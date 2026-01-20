import {
  Theme as FluentTheme,
  teamsDarkTheme,
  teamsLightTheme,
  webDarkTheme,
  webLightTheme,
} from '@fluentui/react-components'
import { OverridedFluentTheme } from './CustomStyleHooks'

export const Light = 'light'
export const Dark = 'dark'
export const KnownColorSchemes = [Light, Dark] as const
export type ColorScheme = typeof Light | typeof Dark

export interface ColorSchemeTheme { [Light]: FluentTheme, [Dark]: FluentTheme }
function createColorSchemeTheme (
  [light, dark]: [FluentTheme, FluentTheme],
  font: string | null,
): ColorSchemeTheme {
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

// Apply scaling by setting root font size
export function applyScaling (scale: ScaleLevel) {
  const root = window.document.documentElement
  root.style.setProperty('--base-font-size', `${scale}px`)
  root.style.fontSize = `var(--base-font-size)`
}

// Detect preferred color scheme
export function prefersColorScheme (): ColorScheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? Light
    : Dark
}
