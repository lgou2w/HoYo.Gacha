import { declareCommand } from '@/api/command'
import { ColorScheme } from '@/contexts/Theme'

export type Environment = Readonly<{
  app: Readonly<{
    id: string
    name: string
    pkgName: string
    version: string
  }>
  git: Readonly<{
    commitHash: string
    commitDate: string
    remoteUrl: string
  }>
  cwd: string
  hwnd: number
  locale: string
  tauriVersion: string
  webviewVersion: string
  os: Readonly<{
    edition: string
    architecture: string
  }>
  windows: Readonly<{
    version: string
    isWindows11: boolean
  }> | null
}>

const AppCommands = {
  /** Panic the application (for testing purpose) (Dev only) */
  panic:
    import.meta.env.DEV
      ? declareCommand<undefined>('panic')
      : null,

  environment:
    declareCommand<undefined, Environment>('environment', true),

  changeColorScheme:
    declareCommand<{ value: ColorScheme | null }>('change_color_scheme'),

  createAppLnk:
    declareCommand<undefined>('create_app_lnk'),

  systemFonts:
    declareCommand<undefined, string[]>('system_fonts', true),

  pickFile:
    declareCommand<{
      title?: string | null
      directory?: string | null
      /** [name, extension[]] */
      filters?: [string, string[]][]
    }, string | null>('pick_file'),

  pickFolder:
    declareCommand<{
      title?: string | null
      directory?: string | null
    }, string | null>('pick_folder'),
} as const

Object.freeze(AppCommands)

export default AppCommands

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  var __APP_COMMANDS__: typeof AppCommands
}

if (!globalThis.__APP_COMMANDS__) {
  globalThis.__APP_COMMANDS__ = AppCommands
}
