import React, { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import Theme from '@/components/Core/Theme'
import TitleBar from '@/components/Core/TitleBar'
import router from '@/router'
import '@/assets/global.css'
import '@/locales/init'

export default function App () {
  return (
    <Suspense fallback="Loading">
      <Theme>
        <TitleBar />
        <RouterProvider router={router} />
      </Theme>
    </Suspense>
  )
}
