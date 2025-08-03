import React, { ComponentRef, useCallback } from 'react'
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

  const handleUpdater = useCallback((ref: ComponentRef<typeof Updater> | null) => {
    if (isUpdated || !ref) {
      return
    }

    isUpdated = true
    ref.start(true)
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
            <Updater ref={(ref) => handleUpdater(ref)} />
          </AuthorOnly>
        )}
        <Webview2Alert />
      </Layout>
    </ThemeProvider>
  )
}
