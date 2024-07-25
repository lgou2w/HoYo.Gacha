import React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import ThemeProvider from '@/components/ThemeProvider'
import Layout from '@/components/UI/Layout'
import { LocalStorageThemeStore } from '@/interfaces/Theme'

const themeStore = new LocalStorageThemeStore()

const rootRoute = createRootRoute({
  shouldReload: false,
  pendingMinMs: 0,
  async loader () {
    const initialThemeData = await themeStore.load()
    return {
      initialThemeData,
      themeStore
    }
  },
  component: Root
})

// eslint-disable-next-line react-refresh/only-export-components
function Root () {
  const { initialThemeData, themeStore } = rootRoute.useLoaderData()
  return (
    <ThemeProvider initialData={initialThemeData} store={themeStore}>
      <Layout>
        <Outlet />
      </Layout>
    </ThemeProvider>
  )
}

export default rootRoute
