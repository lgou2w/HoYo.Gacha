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
