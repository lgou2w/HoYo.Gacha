import invoke, { InvokeArgs, InvokeOptions } from '@/api/invoke'

export type Command<Args extends InvokeArgs, Result = void> =
  Args extends never
    ? (options?: InvokeOptions) => Promise<Result>
    : (args: Args, options?: InvokeOptions) => Promise<Result>

export function declareCommand<
  Args extends InvokeArgs,
  Result = void
> (name: string): Command<Args, Result> {
  if (import.meta.env.DEV) {
    console.debug('Declaration command:', name)
  }

  return invoke.bind(undefined, name) as Command<Args, Result>
}
