import React from 'react'
import { Outlet } from '@tanstack/react-router'
import ThemeProvider from '@/components/ThemeProvider'
import Layout from '@/components/UI/Layout'
import rootRoute from './route'

export default function Root () {
  const { initialThemeData, themeStore } = rootRoute.useLoaderData()
  return (
    <ThemeProvider initialData={initialThemeData} store={themeStore}>
      <Layout>
        <Outlet />
      </Layout>
    </ThemeProvider>
  )
}
