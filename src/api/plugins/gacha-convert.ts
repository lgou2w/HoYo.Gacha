import { Account } from '@/api/interfaces/account'
import { defineCommand, IdentifierError, isIdentifierError } from './declares'

// See: src-tauri/src/gacha/convert/plugin.rs

const PluginName = 'hg_gacha_convert'

type Command =
  | 'export_gacha_records'
  | 'import_gacha_records'

function bind<Payload = void, Result = void> (command: Command) {
  return defineCommand<Payload, Result>(PluginName, command)
}

// Error

const Identifier = 'GachaConvertError' as const

export interface GachaConvertError extends IdentifierError<typeof Identifier> {
}

export function isGachaConvertError (
  error: Error | object | unknown
): error is GachaConvertError {
  return isIdentifierError(error) &&
    error.identifier === Identifier
}

// Plugin

export const GachaConvertPlugin = {
  name: PluginName,
  // Declared commands
  exportGachaRecords: bind<Pick<Account, 'business' | 'uid'> & {
    output: string
    pretty: boolean | null
  }, number>('export_gacha_records'),
  importGachaRecords: bind<Pick<Account, 'business' | 'uid'> & {
    input: string
  }, number>('import_gacha_records')
} as const
