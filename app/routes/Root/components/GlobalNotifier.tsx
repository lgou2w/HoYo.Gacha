import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import useGlobalNotifier from '@/routes/Root/hooks/useGlobalNotifier'
import Notifier from './Notifier'

export default function GlobalNotifier () {
  const { toasterId, dismissAll } = useGlobalNotifier()
  const { subscribe } = useRouter()

  // HACK: Dismiss all toasts when the path changes
  useEffect(() => {
    return subscribe('onBeforeLoad', (event) => {
      if (event.pathChanged) {
        dismissAll()
      }
    })
  }, [dismissAll, subscribe])

  return (
    <Notifier
      toasterId={toasterId}
      position="top-end"
    />
  )
}
