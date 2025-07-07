import React from 'react'
import { Outlet } from '@tanstack/react-router'
import Layout from '@/components/Layout'
import ThemeProvider from '@/components/ThemeProvider'
import RootRoute from './route'

export default function Root () {
  const { initialThemeData, themeStore } = RootRoute.useLoaderData()
  return (
    <ThemeProvider initialData={initialThemeData} store={themeStore}>
      <Layout>
        <Outlet />
      </Layout>
    </ThemeProvider>
  )
}
