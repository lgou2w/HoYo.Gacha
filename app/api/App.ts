import { declareCommand } from './command'

// commands
export const AppCommands = {
  locale:
    declareCommand<undefined, string>('locale', { once: true }),
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
