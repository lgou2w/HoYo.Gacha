import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet } from '@tanstack/react-router'
import ThemeProvider from '@/contexts/Theme/Provider'
import Layout from './components/Layout'
import rootRoute from './route'

export default function Root () {
  const { themeData } = rootRoute.useLoaderData()
  const { themeStore } = rootRoute.useRouteContext()

  return (
    <ThemeProvider
      themeData={themeData}
      themeStore={themeStore}
      isSupportedMica={true}
    >
      <Layout>
        <Outlet />
      </Layout>
      <ReactQueryDevtools />
    </ThemeProvider>
  )
}
