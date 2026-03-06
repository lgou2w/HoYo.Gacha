type AnyFunction = (...args: readonly unknown[]) => unknown

export interface DebounceOptions {
  immediate?: boolean
}

export interface DebouncedFunction<F extends AnyFunction> {
  (...args: Parameters<F>): ReturnType<F> | undefined

  readonly isPending: boolean
  clear(): void
  flush(): void
  trigger(): void
}

export default function debounce<F extends AnyFunction> (
  func: F,
  wait = 100,
  options?: DebounceOptions,
): DebouncedFunction<F> {
  if (typeof func !== 'function') {
    throw new TypeError('Expected a function')
  }

  if (wait < 0) {
    throw new RangeError('Expected a non-negative number for wait time')
  }

  const { immediate } = options || {}

  let storedContext: unknown
  let storedArguments: unknown[] | undefined
  let timeoutId: number | undefined
  let timestamp: number
  let result: unknown

  function run () {
    const callContext = storedContext
    const callArguments = storedArguments
    storedContext = undefined
    storedArguments = undefined
    result = func.apply(callContext, callArguments!)
    return result
  }

  function later () {
    const last = Date.now() - timestamp!

    if (last < wait && last >= 0) {
      timeoutId = window.setTimeout(later, wait - last)
    } else {
      timeoutId = undefined

      if (!immediate) {
        result = run()
      }
    }
  }

  const debounced = function (this: unknown, ...args: unknown[]) {
    if (
      storedContext
      && this !== storedContext
      && Object.getPrototypeOf(this) === Object.getPrototypeOf(storedContext)
    ) {
      throw new Error('Debounced function is already running in a different context')
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    storedContext = this
    storedArguments = args
    timestamp = Date.now()

    const callNow = immediate && !timeoutId

    if (!timeoutId) {
      timeoutId = window.setTimeout(later, wait)
    }

    if (callNow) {
      result = run()
      return result
    }

    return undefined
  }

  Object.defineProperty(debounced, 'isPending', {
    get () {
      return timeoutId !== undefined
    },
  })

  debounced.clear = () => {
    if (!timeoutId) {
      return
    }

    window.clearTimeout(timeoutId)
    timeoutId = undefined
    storedContext = undefined
    storedArguments = undefined
  }

  debounced.flush = () => {
    if (!timeoutId) {
      return
    }

    debounced.trigger()
  }

  debounced.trigger = () => {
    result = run()

    debounced.clear()
  }

  return debounced! as unknown as DebouncedFunction<F>
}
