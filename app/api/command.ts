import invoke, { InvokeArgs } from '@/api/invoke'

export type ArgsCommand<Args extends InvokeArgs | undefined, Result = void>
  = (args: Args) => Promise<Result>

export type NonArgsCommand<Result = void>
  = () => Promise<Result>

export type Command<Args extends InvokeArgs | undefined, Result = void>
  = [Args] extends [undefined]
    ? NonArgsCommand<Result>
    : ArgsCommand<Args, Result>

export type OnceCommand<Args extends InvokeArgs | undefined, Result = void>
  = Command<Args, Result> & {
    /** Indicates whether the command has been initialized */
    readonly initialized: boolean
    /** Resets the command to its initial state */
    reset(): void
  }

export interface DeclareCommandOptions {
  /**
   * Indicates whether the command should be executed only once. If set to true, the command will be executed only on the first invocation and subsequent invocations will return the same result without re-executing the command.
   */
  once?: boolean | null
}

/**
 * Declares a command with the specified name. The command can be executed with the provided arguments and will return a promise that resolves to the result of the command execution.
 * @param name The name of the command to declare.
 */
export function declareCommand<Args extends InvokeArgs | undefined, Result = void> (
  name: string,
): Command<Args, Result>

/**
 * Declares a once command with the specified name. The command can be executed with the provided arguments and will return a promise that resolves to the result of the command execution. The command will be executed only on the first invocation and subsequent invocations will return the same result without re-executing the command.
 * @param name The name of the command to declare.
 * @param options The options for the command, which must include `once: true`.
 */
export function declareCommand<Args extends InvokeArgs | undefined, Result = void> (
  name: string,
  options: { once: true },
): OnceCommand<Args, Result>

/**
 * Declares a normal command with the specified name and options. The command can be executed with the provided arguments and will return a promise that resolves to the result of the command execution.
 * @param name The name of the command to declare.
 * @param options The options for the command.
 */
export function declareCommand<Args extends InvokeArgs | undefined, Result = void> (
  name: string,
  options: { once?: false },
): Command<Args, Result>

/**
 * Declares a command with the specified name and options. The command can be executed with the provided arguments and will return a promise that resolves to the result of the command execution. If the `once` option is set to true, the command will be executed only on the first invocation and subsequent invocations will return the same result without re-executing the command.
 * @param name The name of the command to declare.
 * @param options The options for the command.
 * @returns The declared command.
 */
export function declareCommand<Args extends InvokeArgs | undefined, Result = void> (
  name: string,
  options?: DeclareCommandOptions,
): Command<Args, Result> | OnceCommand<Args, Result> {
  const once = options?.once ?? false

  if (import.meta.env.DEV) {
    console.debug(`[Command] Declaration ${once ? 'once ' : ''}command:`, name)
  }

  const command = invoke.bind(undefined, name) as Command<Args, Result>
  return once ? withOnce(command) : command
}

function withOnce<Args extends InvokeArgs | undefined, Result = void> (
  command: Command<Args, Result>,
): OnceCommand<Args, Result> {
  let initialized = false
  let promise: Promise<Result> | undefined

  const onceCommand = function (this: unknown, ...args: unknown[]) {
    if (!initialized) {
      initialized = true
      promise = command.apply(this, args as [Args]).catch((error) => {
        console.warn('[Command] The promise of the cached command %s is not resolved: %o', command.name, error)
        initialized = false
        promise = undefined

        const enhancedError = new Error(`Command "${command.name}" execution failed: ${error.message}`)
        enhancedError.cause = error
        throw enhancedError
      })

      if (import.meta.env.DEV) {
        promise.then(
          (result) => {
            console.debug('[Command] Once command %s resolved with result: %o', command.name, result)
          },
          (error) => {
            console.debug('[Command] Once command %s execution failed: %o', command.name, error)
          },
        )
      }
    }
    return promise
  } as OnceCommand<Args, Result>

  Object.defineProperties(onceCommand, {
    initialized: {
      configurable: false,
      enumerable: true,
      get: () => initialized,
    },
    reset: {
      configurable: false,
      value: () => {
        initialized = false
        promise = undefined
      },
    },
  })

  return onceCommand
}
