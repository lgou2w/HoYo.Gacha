import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import queryClient from '@/queryClient'
import router from '@/router'
import '@/assets/global.css'
import '@/i18n'

export default function App () {
  // Avoid refresh pages in production
  React.useEffect(() => {
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

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
