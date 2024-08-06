import React from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import useAppInit from '@/hooks/useAppInit'
import queryClient from '@/queryClient'
import router from '@/router'
import '@/assets/global.css'
import '@/assets/fui.css'
import '@/i18n'

export default function App () {
  useAppInit()
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
