import {
  BrandVariants,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createThemeByBrandVariants (variants: BrandVariants) {
  return createTheme([
    createLightTheme(variants),
    createDarkTheme(variants)
  ])
}

export const Themes = {
  web: createTheme([webLightTheme, webDarkTheme]),
  teams: createTheme([teamsLightTheme, teamsDarkTheme])
  // FIXME: https://github.com/tauri-apps/tauri/issues/8180
  // vibrancy: createThemeByBrandVariants({
  //   10: '#030303',
  //   20: '#171717',
  //   30: '#252525',
  //   40: '#313131',
  //   50: '#3D3D3D',
  //   60: '#494949',
  //   70: '#565656',
  //   80: '#636363',
  //   90: '#717171',
  //   100: '#7F7F7F',
  //   110: '#8D8D8D',
  //   120: '#9B9B9B',
  //   130: '#AAAAAA',
  //   140: '#B9B9B9',
  //   150: '#C8C8C8',
  //   160: '#D7D7D7'
  // })
}

export type ThemeSpace = keyof typeof Themes

export const KnownThemeSpaces = Object.keys(Themes) as ThemeSpace[]
export const KnownThemeColors: ThemeColor[] = ['light', 'dark']

// FIXME: https://github.com/tauri-apps/tauri/issues/8180
// See: src-tauri/src/main.ts -> Apply window vibrancy
// export const WindowVibrancy = window.localStorage.getItem('WINDOW_VIBRANCY') === 'true'

// if (import.meta.env.DEV) {
//   console.debug('Window Vibrancy:', WindowVibrancy)
// }
