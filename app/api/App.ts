import { declareCommand } from './command'

export interface Environment {
  app: {
    id: string
    name: string
    pkgName: string
    version: string
  }
  cwd: string
  locale: string
  tauriVersion: string
  webviewVersion: string
  osInfo: {
    edition: string
    architecture: string
  }
  windowsVersion: string
  isWindows11: boolean
}

// commands
export const AppCommands = {
  locale:
    declareCommand<undefined, string>('locale', { once: true }),

  environment:
    declareCommand<undefined, Environment>('environment', { once: true }),
} as const

Object.freeze(AppCommands)

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  var __APP_COMMANDS__: typeof AppCommands
}

if (!globalThis.__APP_COMMANDS__) {
  globalThis.__APP_COMMANDS__ = AppCommands
}
