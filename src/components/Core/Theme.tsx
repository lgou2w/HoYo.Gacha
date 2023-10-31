import React, { PropsWithChildren } from 'react'
import {
  BrandVariants,
  FluentProvider,
  Theme,
  createDarkTheme,
  createLightTheme,
  webLightTheme,
  webDarkTheme,
  teamsLightTheme,
  teamsDarkTheme
} from '@fluentui/react-components'

// See: Docs
// https://react.fluentui.dev/?path=/story/themedesigner--page
// https://react.fluentui.dev/?path=/docs/concepts-developer-theming--page

// Convert px -> rem
const Override: Partial<Theme> = {
  fontSizeBase100: '0.625rem',
  fontSizeBase200: '0.75rem',
  fontSizeBase300: '0.875rem',
  fontSizeBase400: '1rem',
  fontSizeBase500: '1.25rem',
  fontSizeBase600: '1.5rem',
  fontSizeHero700: '1.75rem',
  fontSizeHero800: '2rem',
  fontSizeHero900: '2.5rem',
  fontSizeHero1000: '4.25rem',
  lineHeightBase100: '0.875rem',
  lineHeightBase200: '1rem',
  lineHeightBase300: '1.5rem',
  lineHeightBase400: '1.375rem',
  lineHeightBase500: '1.75rem',
  lineHeightBase600: '2.rem',
  lineHeightHero700: '2.25rem',
  lineHeightHero800: '2.5rem',
  lineHeightHero900: '3.25rem',
  lineHeightHero1000: '5.75rem',
  spacingHorizontalNone: '0',
  spacingHorizontalXXS: '0.125rem',
  spacingHorizontalXS: '0.25rem',
  spacingHorizontalSNudge: '0.375rem',
  spacingHorizontalS: '0.5rem',
  spacingHorizontalMNudge: '0.625rem',
  spacingHorizontalM: '0.75rem',
  spacingHorizontalL: '1rem',
  spacingHorizontalXL: '1.25rem',
  spacingHorizontalXXL: '1.5rem',
  spacingHorizontalXXXL: '2rem',
  spacingVerticalNone: '0',
  spacingVerticalXXS: '0.125rem',
  spacingVerticalXS: '0.25rem',
  spacingVerticalSNudge: '0.375rem',
  spacingVerticalS: '0.5rem',
  spacingVerticalMNudge: '0.625rem',
  spacingVerticalM: '0.75rem',
  spacingVerticalL: '1rem',
  spacingVerticalXL: '1.25rem',
  spacingVerticalXXL: '1.5rem',
  spacingVerticalXXXL: '2rem'
}

export type ThemeColor = 'light' | 'dark'

function createTheme ([light, dark]: [Theme, Theme]) {
  return {
    light: { ...light, ...Override },
    dark: { ...dark, ...Override }
  } as const
}

function createThemeByBrandVariants (variants: BrandVariants) {
  return createTheme([
    createLightTheme(variants),
    createDarkTheme(variants)
  ])
}

export const Themes = {
  web: createTheme([webLightTheme, webDarkTheme]),
  teams: createTheme([teamsLightTheme, teamsDarkTheme]),
  blue: createThemeByBrandVariants({
    10: '#020305',
    20: '#121725',
    30: '#182542',
    40: '#1C315A',
    50: '#1F3D73',
    60: '#20498D',
    70: '#1F56A8',
    80: '#1C63C3',
    90: '#1471E0',
    100: '#027FFD',
    110: '#4A8DFF',
    120: '#6D9BFF',
    130: '#88A9FF',
    140: '#A0B8FF',
    150: '#B7C7FF',
    160: '#CCD6FF'
  }),
  deepblue: createThemeByBrandVariants({
    10: '#020305',
    20: '#101820',
    30: '#152838',
    40: '#18354C',
    50: '#194260',
    60: '#194F75',
    70: '#175D8A',
    80: '#126CA0',
    90: '#077AB7',
    100: '#2E88C5',
    110: '#5295CC',
    120: '#6DA3D3',
    130: '#85B1DA',
    140: '#9DBFE1',
    150: '#B3CDE8',
    160: '#C9DBEE'
  })
}

export type KnownedThemeSpaces = keyof typeof Themes

interface Props {
  space?: KnownedThemeSpaces
  color?: ThemeColor
}

const DefaultThemeSpace: KnownedThemeSpaces = 'web'
const DefaultColor: ThemeColor = 'light'

function lookupThemeSpaces (space?: KnownedThemeSpaces) {
  space ||= DefaultThemeSpace

  const theme: Record<ThemeColor, Theme> | undefined = Themes[space]
  if (!theme) {
    throw new Error(`Unknown theme space value: ${space}`)
  }

  return theme
}

export default function Theme (props: PropsWithChildren<Props>) {
  const {
    space = DefaultThemeSpace,
    color = DefaultColor,
    children
  } = props

  const themeSpaces = lookupThemeSpaces(space)
  const theme = themeSpaces[color]

  if (import.meta.env.DEV) {
    console.debug(`Use theme space '${space}' and color '${color}'`)
  }

  return (
    <FluentProvider theme={theme}>
      {children}
    </FluentProvider>
  )
}
