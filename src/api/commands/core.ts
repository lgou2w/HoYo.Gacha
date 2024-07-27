import { declareCommand } from '.'

export type SetWindowThemeArgs = { dark: boolean }
export const setWindowTheme = declareCommand<SetWindowThemeArgs>('core_set_window_theme')
