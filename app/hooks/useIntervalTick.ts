import { useEffect, useState } from 'react'

/**
 * Re-renders the component every `delay` milliseconds and returns an
 * incrementing counter.
 *
 * The returned value starts at `0` and increments by one on each tick.
 * It can be used as a `useEffect` dependency to subscribe to the tick
 * itself; if you only need the re-render, you can safely ignore it.
 *
 * @param delay - Interval in milliseconds. Must be a finite number greater
 *                than `0`. Values of `0`, negative numbers, `NaN`, and
 *                `Infinity` are ignored and no timer is started.
 * @returns An incrementing counter, starting at `0` and incremented by one
 *          on each tick.
 *
 * @example
 * // Only re-render, ignore the tick value.
 * useIntervalTick(1000)
 *
 * @example
 * // Subscribe to the tick and run a side effect every second.
 * const tick = useIntervalTick(1000)
 * useEffect(() => {
 *   console.log('tick', tick)
 * }, [tick])
 */
export default function useIntervalTick (delay: number) {
  const [n, forceUpdate] = useState(0)

  useEffect(() => {
    if (!Number.isFinite(delay) || delay <= 0) {
      return
    }

    const timerId = setInterval(() => {
      forceUpdate((prevN) => prevN + 1)
    }, delay)

    return () => {
      clearInterval(timerId)
    }
  }, [delay])

  return n
}
