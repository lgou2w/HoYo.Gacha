import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet } from '@tanstack/react-router'
import EnvironmentProvider from '@/contexts/Environment/Provider'
import ThemeProvider from '@/contexts/Theme/Provider'
import Layout from './components/Layout'
import rootRoute from './route'

export default function Root () {
  const { environment, themeData } = rootRoute.useLoaderData()
  const { themeStore } = rootRoute.useRouteContext()

  return (
    <EnvironmentProvider value={environment}>
      <ThemeProvider
        themeData={themeData}
        themeStore={themeStore}
        isSupportedMica={environment.isWindows11}
      >
        <Layout>
          <Outlet />
        </Layout>
        <ReactQueryDevtools />
      </ThemeProvider>
    </EnvironmentProvider>
  )
}
