import invoke from '@/api/invoke'

const CommandPrefix = 'plugin:'

function resolveCommand (pluginName: string, command: string): string {
  if (command.startsWith(CommandPrefix)) {
    throw new Error(`Command name '${command}' cannot starts with '${CommandPrefix}'`)
  }

  // plugin:foo|bar
  return `${CommandPrefix}${pluginName}|${command}`
}

export type Command<Payload = void, Result = void> =
  Payload extends void
    ? () => Result extends Promise<unknown> ? Result : Promise<Result>
    : Payload extends object
      ? (payload: Payload) => Result extends Promise<unknown> ? Result : Promise<Result>
      : never

export function defineCommand<
  Payload = void,
  Result = void
> (
  pluginName: string,
  command: string
): Command<Payload, Result> {
  const cmd = resolveCommand(pluginName, command)
  return invoke.bind(undefined, cmd) as Command<Payload, Result>
}

// Error

export interface IdentifierError<T extends string> {
  identifier: T
  message: string
}

export function isIdentifierError<T extends string> (
  error: Error | object | unknown
): error is IdentifierError<T> {
  return (error instanceof Error || typeof error === 'object') &&
    error !== null &&
    'identifier' in error &&
    typeof error.identifier === 'string'
}
