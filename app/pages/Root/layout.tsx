import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet } from '@tanstack/react-router'
import { EnvironmentProvider } from '@/contexts/Environment'
import { ThemeProvider } from '@/contexts/Theme'
import AppLayout from './components/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
import rootRoute from './route'

export default function RootLayout () {
  const { environment, themeData, themeStore } = rootRoute.useLoaderData()

  return (
    <EnvironmentProvider environment={environment}>
      <ThemeProvider
        themeData={themeData}
        themeStore={themeStore}
        isSupportedMica={environment.windows?.isWindows11}
      >
        <AppLayout>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </AppLayout>
        <ReactQueryDevtools />
      </ThemeProvider>
    </EnvironmentProvider>
  )
}
