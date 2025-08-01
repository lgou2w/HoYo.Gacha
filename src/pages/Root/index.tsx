import React, { ComponentRef, useEffect, useRef } from 'react'
import { Outlet } from '@tanstack/react-router'
import AuthorOnly from '@/components/AuthorOnly'
import Layout from '@/components/Layout'
import ThemeProvider from '@/components/ThemeProvider'
import Updater from '@/components/Updater'
import Webview2Alert from '@/components/Webview2Alert'
import RootRoute from './route'

let isUpdated = false

export default function Root () {
  const { supportedWindowVibrancy, initialThemeData, themeStore } = RootRoute.useLoaderData()
  const updaterRef = useRef<ComponentRef<typeof Updater>>(null)

  useEffect(() => {
    if (isUpdated || !updaterRef.current) {
      return
    }

    isUpdated = true
    updaterRef.current.start(true)
  }, [])

  return (
    <ThemeProvider
      supportedWindowVibrancy={supportedWindowVibrancy}
      initialData={initialThemeData}
      store={themeStore}
    >
      <Layout>
        <Outlet />
        {import.meta.env.PROD && (
          <AuthorOnly>
            <Updater ref={updaterRef} />
          </AuthorOnly>
        )}
        <Webview2Alert />
      </Layout>
    </ThemeProvider>
  )
}
