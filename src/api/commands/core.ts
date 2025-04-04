import { OsInfo } from '@/interfaces/Os'
import { ColorScheme } from '@/interfaces/Theme'
import { declareCommand } from '.'

export const osInfo = declareCommand<undefined, OsInfo>('core_os_info', true)

export const locale = declareCommand<undefined, string | null>('core_locale', true)

export const webview2Version = declareCommand<undefined, string>('core_webview2_version', true)

export const tauriVersion = declareCommand<undefined, string>('core_tauri_version', true)

export type ChangeThemeArgs = { colorScheme: ColorScheme }
export const changeTheme = declareCommand<ChangeThemeArgs>('core_change_theme')

export type PickFileArgs = {
  title?: string | null
  directory?: string | null
  filters?: Array<[string, string[]]> | null // [name, extension[]]
}
export const pickFile = declareCommand<PickFileArgs, string | null>('core_pick_file')

export type PickFolderArgs = Omit<PickFileArgs, 'filters'>
export const pickFolder = declareCommand<PickFolderArgs, string | null>('core_pick_folder')
