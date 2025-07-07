import { Theme as FluentTheme } from '@fluentui/react-components'

// See: Docs
// https://react.fluentui.dev/?path=/story/themedesigner--page
// https://react.fluentui.dev/?path=/docs/concepts-developer-theming--page

// Convert px -> rem
const OverridedFluentTheme: Partial<FluentTheme> = {
  borderRadiusNone: '0',
  borderRadiusSmall: '0.125rem',
  borderRadiusMedium: '0.25rem',
  borderRadiusLarge: '0.375rem',
  borderRadiusXLarge: '0.5rem',
  borderRadiusCircular: '625rem', // 10000px / 16 = 625rem
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
  lineHeightBase300: '1.25rem',
  lineHeightBase400: '1.375rem',
  lineHeightBase500: '1.75rem',
  lineHeightBase600: '2rem',
  lineHeightHero700: '2.25rem',
  lineHeightHero800: '2.5rem',
  lineHeightHero900: '3.25rem',
  lineHeightHero1000: '5.75rem',
  strokeWidthThin: '0.0625rem',
  strokeWidthThick: '0.125rem',
  strokeWidthThicker: '0.1875rem',
  strokeWidthThickest: '0.25rem',
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
  spacingVerticalXXXL: '2rem',
}

export default OverridedFluentTheme
