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

export function deviceSpec (env: Environment) {
  const appVersion = env.app.version
  const shortHash = env.git.commitHash.substring(0, 7)

  return {
    OperatingSystem: env.os.edition,
    SystemVersion: env.windows?.version + ' ' + env.os.architecture,
    Webview2: env.webviewVersion,
    Tauri: env.tauriVersion,
    GitCommit: env.git.commitHash,
    AppVersion: {
      version: appVersion,
      shortHash,
      date: env.git.commitDate,
      text: `${appVersion}-git-${shortHash}`,
      link: `${env.git.remoteUrl}/commit/${env.git.commitHash}`,
    },
  }
}

export interface PickFileArgs extends Record<string, unknown> {
  title?: string | null
  directory?: string | null
  /** [name, extension[]] */
  filters?: [string, string[]][]
}

export interface PickFolderArgs extends Record<string, unknown> {
  title?: string | null
  directory?: string | null
}

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
    declareCommand<PickFileArgs, string | null>('pick_file'),

  pickFolder:
    declareCommand<PickFolderArgs, string | null>('pick_folder'),
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
