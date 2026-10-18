import { createContext } from 'react'
import { Theme as FluentTheme, teamsDarkTheme, teamsLightTheme, webDarkTheme, webLightTheme } from '@fluentui/react-components'
import { OverridedFluentTokens } from './CustomStyleHooks'

export const Light = 'light'
export type Light = typeof Light
export const Dark = 'dark'
export type Dark = typeof Dark
export const KnownColorSchemes = [Light, Dark] as const
export type ColorScheme = typeof Light | typeof Dark

export interface ColorSchemeTheme {
  [Light]: FluentTheme
  [Dark]: FluentTheme
}

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
      ...OverridedFluentTokens,
      ...(font ? { fontFamilyBase: font + light.fontFamilyBase } : {}),
    },
    [Dark]: {
      ...dark,
      ...OverridedFluentTokens,
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

export type NamespaceThemes = Record<Namespace, ReturnType<typeof createColorSchemeTheme>>
export function createNamespaceThemes (font: string | null): NamespaceThemes {
  return {
    teams: createColorSchemeTheme([teamsLightTheme, teamsDarkTheme], font),
    web: createColorSchemeTheme([webLightTheme, webDarkTheme], font),
  }
}

// Scale level: 1.0x, 1.2x, 1.5x, 1.8x, 2.0x
// Suitable for default system scaling at high resolution
// E.g.: 2K 100% Scaling -> 20 (1.2x)
export type ScaleLevel = 16 | 20 | 24 | 28 | 32

// ThemeData

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

// Utilites

export function prefersColorScheme (): ColorScheme {
  return matchMedia('(prefers-color-scheme: light)').matches
    ? Light
    : Dark
}

// Apply scaling by setting root font size
export function applyScaling (scale: ScaleLevel) {
  const root = document.documentElement
  root.style.setProperty('--base-font-size', `${scale}px`)
  root.style.fontSize = `var(--base-font-size)`
}

// Context

export interface ThemeContextValue {
  readonly data: ThemeData
  updateTheme (updated: Partial<ThemeData>): void | Promise<void>
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
ThemeContext.displayName = 'ThemeContext'
