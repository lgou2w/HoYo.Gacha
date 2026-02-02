import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import useNotifier from '@/pages/Root/hooks/useNotifier'
import Notifier from './Notifier'

export const AppToasterId = 'app-toaster'

export default function AppNotifier () {
  const notifier = useNotifier(AppToasterId)
  const router = useRouter()

  // HACK: Dismiss all toasts when the path changes
  useEffect(() => {
    return router.subscribe('onBeforeNavigate', (event) => {
      if (event.pathChanged) {
        notifier.dismissAll()
      }
    })
  }, [notifier, router])

  return (
    <Notifier
      toasterId={notifier.toasterId}
      position="top-end"
    />
  )
}
