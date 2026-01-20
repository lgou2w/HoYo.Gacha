import { FluentProviderCustomStyleHooks, Theme as FluentTheme } from '@fluentui/react-components'
import useBadgeStyles from './useBadgeStyles'
import useButtonStyles from './useButtonStyles'
import useDialogBodyStyles from './useDialogBodyStyles'
import useDialogContentStyles from './useDialogContentStyles'
import useDialogSurfaceStyles from './useDialogSurfaceStyles'
import useDividerStyles from './useDividerStyles'
import useDropdownStyles from './useDropdownStyles'
import useFieldStyles from './useFieldStyles'
import useInputStyles from './useInputStyles'
import useMenuButtonStyles from './useMenuButtonStyles'
import useMenuGroupHeaderStyles from './useMenuGroupHeaderStyles'
import useMenuItemRadioStyles from './useMenuItemRadioStyles'
import useMenuItemStyles from './useMenuItemStyles'
import useMenuListStyles from './useMenuListStyles'
import useMenuPopoverStyles from './useMenuPopoverStyles'
import useMenuSplitGroupStyles from './useMenuSplitGroupStyles'
import useProgressBarStyles from './useProgressBarStyles'
import useRadioStyles from './useRadioStyles'
import useSelectStyles from './useSelectStyles'
import useSpinnerStyles from './useSpinnerStyles'
import useSplitButtonStyles from './useSplitButtonStyles'
import useSwitchStyles from './useSwitchStyles'
import useTabStyles from './useTabStyles'
import useTableCellStyles from './useTableCellStyles'
import useTableHeaderCellStyles from './useTableHeaderCellStyles'
import useTextareaStyles from './useTextareaStyles'
import useToastBodyStyles from './useToastBodyStyles'
import useToastStyles from './useToastStyles'
import useToastTitleStyles from './useToastTitleStyles'
import useToasterStyles from './useToasterStyles'
import useTooltipStyles from './useTooltipStyles'

// Fluent UI v9.62.0
// Custom Style Hooks
// https://react.fluentui.dev/?path=/docs/concepts-developer-advanced-styling-techniques--docs
// https://github.com/microsoft/fluentui/pull/34166
type CustomStyleHook = (state: unknown) => void

export const CustomStylesHooks: FluentProviderCustomStyleHooks = {
  useBadgeStyles_unstable: useBadgeStyles as CustomStyleHook,
  useButtonStyles_unstable: useButtonStyles as CustomStyleHook,
  useDialogContentStyles_unstable: useDialogContentStyles as CustomStyleHook,
  useDialogBodyStyles_unstable: useDialogBodyStyles as CustomStyleHook,
  useDialogSurfaceStyles_unstable: useDialogSurfaceStyles as CustomStyleHook,
  useDividerStyles_unstable: useDividerStyles as CustomStyleHook,
  useDropdownStyles_unstable: useDropdownStyles as CustomStyleHook,
  useFieldStyles_unstable: useFieldStyles as CustomStyleHook,
  useInputStyles_unstable: useInputStyles as CustomStyleHook,
  useMenuButtonStyles_unstable: useMenuButtonStyles as CustomStyleHook,
  useMenuGroupHeaderStyles_unstable: useMenuGroupHeaderStyles as CustomStyleHook,
  useMenuItemRadioStyles_unstable: useMenuItemRadioStyles as CustomStyleHook,
  useMenuItemStyles_unstable: useMenuItemStyles as CustomStyleHook,
  useMenuListStyles_unstable: useMenuListStyles as CustomStyleHook,
  useMenuPopoverStyles_unstable: useMenuPopoverStyles as CustomStyleHook,
  useMenuSplitGroupStyles_unstable: useMenuSplitGroupStyles as CustomStyleHook,
  useProgressBarStyles_unstable: useProgressBarStyles as CustomStyleHook,
  useRadioStyles_unstable: useRadioStyles as CustomStyleHook,
  useSelectStyles_unstable: useSelectStyles as CustomStyleHook,
  useSpinnerStyles_unstable: useSpinnerStyles as CustomStyleHook,
  useSplitButtonStyles_unstable: useSplitButtonStyles as CustomStyleHook,
  useSwitchStyles_unstable: useSwitchStyles as CustomStyleHook,
  useTabStyles_unstable: useTabStyles as CustomStyleHook,
  useTableCellStyles_unstable: useTableCellStyles as CustomStyleHook,
  useTableHeaderCellStyles_unstable: useTableHeaderCellStyles as CustomStyleHook,
  useTextareaStyles_unstable: useTextareaStyles as CustomStyleHook,
  useToastBodyStyles_unstable: useToastBodyStyles as CustomStyleHook,
  useToasterStyles_unstable: useToasterStyles as CustomStyleHook,
  useToastStyles_unstable: useToastStyles as CustomStyleHook,
  useToastTitleStyles_unstable: useToastTitleStyles as CustomStyleHook,
  useTooltipStyles_unstable: useTooltipStyles as CustomStyleHook,
}

// Customizing a theme
// https://react.fluentui.dev/?path=/story/themedesigner--page
// https://react.fluentui.dev/?path=/docs/concepts-developer-theming--page

// Convert px -> rem
export const OverridedFluentTheme: Partial<FluentTheme> = {
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
