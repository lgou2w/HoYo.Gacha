import { OsInfo } from '@/interfaces/Os'
import { ColorScheme } from '@/interfaces/Theme'
import { declareCommand } from '.'

// #region: Commands

export const osInfo = declareCommand<undefined, OsInfo>('core_os_info', true)

export const locale = declareCommand<undefined, string | null>('core_locale', true)

export const webview2Version = declareCommand<undefined, string>('core_webview2_version', true)

export const tauriVersion = declareCommand<undefined, string>('core_tauri_version', true)

export const gitInfo = declareCommand<undefined, {
  commitHash: string
  commitDate: string
  remoteUrl: string
}>('core_git_info', true)

export const createAppLnk = declareCommand<undefined>('core_create_app_lnk')

export const isSupportedWindowVibrancy = declareCommand<undefined, boolean>('core_is_supported_window_vibrancy', true)

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

export const updaterIsUpdating = declareCommand<undefined, boolean>('core_updater_is_updating')
export const updaterUpdate = declareCommand<{ progressChannel: string }, 'Updating' | 'UpToDate' | { Success: string }>('core_updater_update')

// #endregion

// Export

const CoreCommands = {
  osInfo,
  locale,
  webview2Version,
  tauriVersion,
  gitInfo,
  createAppLnk,
  isSupportedWindowVibrancy,
  changeTheme,
  pickFile,
  pickFolder,
  updaterIsUpdating,
  updaterUpdate,
} as const

Object.freeze(CoreCommands)

export default CoreCommands

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  // eslint-disable-next-line no-var
  var __APP_COMMANDS_CORE__: typeof CoreCommands
}

// eslint-disable-next-line deprecation/deprecation
if (!globalThis.__APP_COMMANDS_CORE__) {
  // eslint-disable-next-line deprecation/deprecation
  globalThis.__APP_COMMANDS_CORE__ = CoreCommands
}
