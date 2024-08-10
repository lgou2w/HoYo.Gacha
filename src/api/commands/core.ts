import { ColorScheme } from '@/interfaces/Theme'
import { declareCommand } from '.'

export const webview2Version = declareCommand<undefined, string>('core_webview2_version')

export type ChangeThemeArgs = { colorScheme: ColorScheme }
export const changeTheme = declareCommand<ChangeThemeArgs>('core_change_theme')
