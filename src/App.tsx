import React from 'react'
import { RouterProvider } from 'react-router-dom'
import Theme from '@/components/Core/Theme'
import TitleBar from '@/components/Core/TitleBar'
import router from './router'
import '@/assets/global.css'

export default function App () {
  return (
    <Theme>
      <TitleBar />
      <RouterProvider router={router} />
    </Theme>
  )
}
