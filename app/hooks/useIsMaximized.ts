import { useEffect, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import debounce from '@/utilities/debounce'

/**
 * Returns a boolean indicating whether the current Tauri webview window is maximized.
 * If the app is not running in Tauri, it will always return false.
 */
export default function useIsMaximized (): boolean {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    // If the app is not running in Tauri, we don't need to do anything
    if (!isTauri()) {
      return
    }

    let unlisten: (() => void) | undefined
    let cancelled = false

    const updateMaximized = async () => {
      const isMaximized = await getCurrentWebviewWindow().isMaximized()
      if (!cancelled) {
        setMaximized(isMaximized)
      }
    }

    ;(async () => {
      await updateMaximized()
      unlisten = await getCurrentWebviewWindow().onResized(
        debounce(updateMaximized, 500, { immediate: false }),
      )
    })()

    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [])

  return maximized
}
