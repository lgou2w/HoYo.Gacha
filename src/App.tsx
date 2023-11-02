import React from 'react'
import { RouterProvider } from 'react-router-dom'
import ThemeProvider from '@/components/Core/Theme/Provider'
import TitleBar from '@/components/Core/TitleBar'
import router from './router'
import '@/assets/global.css'

export default function App () {
  return (
    <ThemeProvider>
      <TitleBar />
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
