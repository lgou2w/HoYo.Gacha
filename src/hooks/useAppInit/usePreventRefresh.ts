import { useEffect } from 'react'

export default function usePreventRefresh () {
  // Prevent context menu and refresh pages in production
  // - Context menu: Right mouse click
  // - Hotkey      : F5, Ctrl + R, Ctrl + P
  useEffect(() => {
    if (import.meta.env.PROD) {
      const preventContextMenu = (evt: Event) => evt.preventDefault()
      const preventHotkey = (evt: KeyboardEvent) => {
        if (evt.key === 'F5' || ((evt.ctrlKey || evt.metaKey) && (evt.key === 'r' || evt.key === 'p'))) {
          evt.preventDefault()
        }
      }
      document.addEventListener('contextmenu', preventContextMenu)
      document.addEventListener('keydown', preventHotkey)
      return () => {
        document.removeEventListener('contextmenu', preventContextMenu)
        document.removeEventListener('keydown', preventHotkey)
      }
    }
  }, [])
}
