import { useEffect } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

/**
 * Controls the current window's `resizable` flag while the component is mounted.
 *
 * Typically used by modal dialogs to lock the window size while they are open,
 * preventing the user from resizing the window behind them. When the component
 * unmounts, `resizable` is restored to `true` so the window does not get stuck
 * in a locked state.
 *
 * No-op in non-Tauri environments (browser dev, SSR).
 *
 * @param enabled - `true` to allow window resizing, `false` to lock it.
 *
 * @example
 * // Inside a dialog component: lock the window while the dialog is open.
 * function MyDialog ({ open }: { open: boolean }) {
 *   useWindowResizable(!open)
 *   return <Dialog open={open}>...</Dialog>
 * }
 */
export default function useWindowResizable (enabled: boolean) {
  useEffect(() => {
    if (!isTauri()) {
      return
    }

    getCurrentWebviewWindow()
      .setResizable(enabled)
      .catch((err) => {
        console.error('Failed to set resizable:', err)
      })
  }, [enabled])

  useEffect(() => {
    if (!isTauri()) {
      return
    }

    return () => {
      getCurrentWebviewWindow()
        .setResizable(true)
        .catch((err) => {
          console.error('Failed to restore resizable:', err)
        })
    }
  }, [])
}
