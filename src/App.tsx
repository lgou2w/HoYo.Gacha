import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import Theme from '@/components/Core/Theme'
import TitleBar from '@/components/Core/TitleBar'
import router from '@/router'
import { queryClient } from '@/store'
import '@/assets/global.css'
import '@/locales/init'

export default function App () {
  return (
    <QueryClientProvider client={queryClient}>
      <Theme>
        <TitleBar />
        <RouterProvider router={router} />
      </Theme>
      <ReactQueryDevtools position="bottom" />
    </QueryClientProvider>
  )
}
