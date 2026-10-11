import { useMemo } from 'react'
import { isTauri } from '@tauri-apps/api/core'

type Fn<Args extends unknown[] = [], R = void> = (...args: Args) => R

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop: Fn = () => {}

/**
 * Returns a function that will run the provided `onTauri` function if the app is running in Tauri, otherwise it will run the `otherwise` function if provided, or a no-op function if not.
 * @param onTauri The function to run if the app is running in Tauri.
 * @param otherwise The function to run if the app is not running in Tauri. If not provided, a no-op function will be used.
 * @returns The function that will run based on the app's environment.
 */
export default function useRunTauri<Args extends unknown[] = [], R = void> (
  onTauri: Fn<Args, R>,
  otherwise?: Fn<Args, R> | null,
): Fn<Args, R> {
  return useMemo(
    () => (isTauri() ? onTauri : otherwise ?? (noop as Fn<Args, R>)),
    [onTauri, otherwise],
  )
}
