import React from 'react'
import { Outlet } from '@tanstack/react-router'
import Layout from '@/components/Layout'
import ThemeProvider from '@/components/ThemeProvider'
import Updater from '@/components/Updater'
import RootRoute from './route'

export default function Root () {
  const { supportedWindowVibrancy, initialThemeData, themeStore } = RootRoute.useLoaderData()
  return (
    <ThemeProvider
      supportedWindowVibrancy={supportedWindowVibrancy}
      initialData={initialThemeData}
      store={themeStore}
    >
      <Layout>
        <Outlet />
        {import.meta.env.PROD && <Updater />}
      </Layout>
    </ThemeProvider>
  )
}
