import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/api/store'
import ThemeProvider from '@/components/Commons/Theme'
import TitleBar from '@/components/Commons/TitleBar'
import router from '@/router'
import '@/assets/global.css'
import '@/locales/init'

export default function App () {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TitleBar />
        <RouterProvider router={router} />
      </ThemeProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
