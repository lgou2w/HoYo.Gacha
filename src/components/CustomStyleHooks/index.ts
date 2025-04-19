/* eslint-disable camelcase */

import { FluentProviderCustomStyleHooks } from '@fluentui/react-components'
import useBadgeStyles from './useBadgeStyles'
import useButtonStyles from './useButtonStyles'
import useDialogBodyStyles from './useDialogBodyStyles'
import useDialogContentStyles from './useDialogContentStyles'
import useDialogSurfaceStyles from './useDialogSurfaceStyles'
import useDropdownStyles from './useDropdownStyles'
import useFieldStyles from './useFieldStyles'
import useInputStyles from './useInputStyles'
import useMenuButtonStyles from './useMenuButtonStyles'
import useMenuGroupHeaderStyles from './useMenuGroupHeaderStyles'
import useMenuItemRadioStyles from './useMenuItemRadioStyles'
import useMenuItemStyles from './useMenuItemStyles'
import useMenuListStyles from './useMenuListStyles'
import useMenuPopoverStyles from './useMenuPopoverStyles'
import useRadioStyles from './useRadioStyles'
import useSelectStyles from './useSelectStyles'
import useSpinnerStyles from './useSpinnerStyles'
import useSplitButtonStyles from './useSplitButtonStyles'
import useSwitchStyles from './useSwitchStyles'
import useTabStyles from './useTabStyles'
import useTextareaStyles from './useTextareaStyles'
import useToastBodyStyles from './useToastBodyStyles'
import useToastStyles from './useToastStyles'
import useToastTitleStyles from './useToastTitleStyles'
import useToasterStyles from './useToasterStyles'
import useTooltipStyles from './useTooltipStyles'

// Fluent UI v9.62.0
// https://react.fluentui.dev/?path=/docs/concepts-developer-advanced-styling-techniques--docs
// https://github.com/microsoft/fluentui/pull/34166
type CustomStyleHook = (state: unknown) => void

const CustomStylesHooks: FluentProviderCustomStyleHooks = {
  useBadgeStyles_unstable: useBadgeStyles as CustomStyleHook,
  useButtonStyles_unstable: useButtonStyles as CustomStyleHook,
  useDialogContentStyles_unstable: useDialogContentStyles as CustomStyleHook,
  useDialogBodyStyles_unstable: useDialogBodyStyles as CustomStyleHook,
  useDialogSurfaceStyles_unstable: useDialogSurfaceStyles as CustomStyleHook,
  useDropdownStyles_unstable: useDropdownStyles as CustomStyleHook,
  useFieldStyles_unstable: useFieldStyles as CustomStyleHook,
  useInputStyles_unstable: useInputStyles as CustomStyleHook,
  useMenuButtonStyles_unstable: useMenuButtonStyles as CustomStyleHook,
  useMenuGroupHeaderStyles_unstable: useMenuGroupHeaderStyles as CustomStyleHook,
  useMenuItemRadioStyles_unstable: useMenuItemRadioStyles as CustomStyleHook,
  useMenuItemStyles_unstable: useMenuItemStyles as CustomStyleHook,
  useMenuListStyles_unstable: useMenuListStyles as CustomStyleHook,
  useMenuPopoverStyles_unstable: useMenuPopoverStyles as CustomStyleHook,
  useRadioStyles_unstable: useRadioStyles as CustomStyleHook,
  useSelectStyles_unstable: useSelectStyles as CustomStyleHook,
  useSpinnerStyles_unstable: useSpinnerStyles as CustomStyleHook,
  useSplitButtonStyles_unstable: useSplitButtonStyles as CustomStyleHook,
  useSwitchStyles_unstable: useSwitchStyles as CustomStyleHook,
  useTabStyles_unstable: useTabStyles as CustomStyleHook,
  useTextareaStyles_unstable: useTextareaStyles as CustomStyleHook,
  useToastBodyStyles_unstable: useToastBodyStyles as CustomStyleHook,
  useToasterStyles_unstable: useToasterStyles as CustomStyleHook,
  useToastStyles_unstable: useToastStyles as CustomStyleHook,
  useToastTitleStyles_unstable: useToastTitleStyles as CustomStyleHook,
  useTooltipStyles_unstable: useTooltipStyles as CustomStyleHook,
}

export default CustomStylesHooks
