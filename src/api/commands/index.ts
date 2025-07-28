import invoke, { InvokeArgs } from '@/api/invoke'

export interface ArgsCommand<Args extends InvokeArgs | undefined, Result = void> {
  (args: Args): Promise<Result>
}

export interface NonArgsCommand<Result = void> {
  (): Promise<Result>
}

export type Command<Args extends InvokeArgs | undefined, Result = void> =
  Args extends undefined
    ? NonArgsCommand<Result>
    : ArgsCommand<Args, Result>

export type CacheableCommand<Args extends InvokeArgs | undefined, Result = void> = Command<Args, Result> & {
  __cached?: Promise<Result>
  readonly hasCached: boolean
  invalidate (): void
}

export function declareCommand<Args extends InvokeArgs | undefined, Result = void> (name: string): Command<Args, Result>
export function declareCommand<Args extends InvokeArgs | undefined, Result = void> (name: string, cacheable: true): CacheableCommand<Args, Result>
export function declareCommand<Args extends InvokeArgs | undefined, Result = void> (
  name: string,
  cacheable?: boolean,
): Command<Args, Result> | CacheableCommand<Args, Result> {
  if (import.meta.env.DEV) {
    console.debug(`Declaration ${!cacheable ? '' : 'cacheable '}command:`, name)
  }

  const command = invoke.bind(undefined, name) as Command<Args, Result>
  if (!cacheable) {
    return command
  }

  const cacheableCommand = function (this: unknown, ...args: unknown[]) {
    if (!cacheableCommand.hasCached) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: 2556
      let promise = (cacheableCommand.__cached = command.apply(this, ...args))

      if (import.meta.env.DEV) {
        promise = promise.then((result) => {
          console.debug('Cache the promise result of command: %s, result = %o', name, result)
          return result
        })
      }

      // It is possible that the result of this command is not idempotent.
      // If the promise doesn't resolved, then remove the cache.
      return promise.catch((error) => {
        console.warn('The promise of the cached command %s is not resolved: %o', name, error)
        cacheableCommand.invalidate()
        throw error
      })
    } else {
      return cacheableCommand.__cached
    }
  } as CacheableCommand<Args, Result>

  return Object.defineProperties(cacheableCommand, {
    hasCached: {
      configurable: false,
      enumerable: true,
      get () {
        return !!cacheableCommand.__cached
      },
    },
    invalidate: {
      configurable: false,
      value () {
        delete cacheableCommand.__cached
      },
    },
  })
}
