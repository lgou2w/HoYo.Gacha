import { useEffect } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

// This hook is used to set the resizable property of the current webview window
// to false when the dialog is open, and to true when the dialog is closed.
// Avoiding the user to resize the window when the dialog is open.
export default function useDialogOpenEffect (open: boolean) {
  useEffect(() => {
    getCurrentWebviewWindow()
      .setResizable(!open)
  }, [open])
}
