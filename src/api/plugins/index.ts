import invoke from '@/api/invoke'

const CommandPrefix = 'plugin:'

function resolveCommand (pluginName: string, command: string): string {
  if (command.startsWith(CommandPrefix)) {
    throw new Error(`Command name '${command}' cannot starts with 'plugin:'`)
  }

  // plugin:foo|bar
  return `${CommandPrefix}${pluginName}|${command}`
}

export type Command<Payload = void, Result = void> =
  Payload extends void
    ? () => Promise<Result>
    : Payload extends object
      ? (payload: Payload) => Promise<Result>
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
