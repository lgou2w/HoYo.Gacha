import { OsInfo } from '@/interfaces/Os'
import { ColorScheme } from '@/interfaces/Theme'
import { declareCommand } from '.'

export const osInfo = declareCommand<undefined, OsInfo>('core_os_info', true)

export const locale = declareCommand<undefined, string | null>('core_locale', true)

export const webview2Version = declareCommand<undefined, string>('core_webview2_version', true)

export const tauriVersion = declareCommand<undefined, string>('core_tauri_version', true)

export type ChangeThemeArgs = { colorScheme: ColorScheme }
export const changeTheme = declareCommand<ChangeThemeArgs>('core_change_theme')
