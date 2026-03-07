import { useEffect } from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Outlet } from '@tanstack/react-router'
import { AccountBusiness, AccountBusinessKeys, KeyofAccountBusiness } from '@/api/schemas/Account'
import { EnvironmentProvider } from '@/contexts/Environment'
import { ThemeProvider } from '@/contexts/Theme'
import { combineGachaPathname } from '@/pages/Gacha/route'
import router from '@/pages/router'
import AppLayout from './components/AppLayout'
import ErrorBoundary from './components/ErrorBoundary'
import UpdaterAlert from './components/UpdaterAlert'
import { MetadataProvider } from './contexts/Metadata'
import { writeMemoryRouteIfEnabled } from './queries/business'
import rootRoute from './route'

const AllowPathnames = AccountBusinessKeys
  .reduce((acc, keyof) => {
    acc[combineGachaPathname(keyof)] = keyof
    return acc
  }, {} as Record<string, KeyofAccountBusiness>)

export default function RootLayout () {
  const { environment, themeData, themeStore } = rootRoute.useLoaderData()

  useEffect(() => {
    // This listener is responsible for writing the memory route when navigating to a business route
    return router.subscribe('onBeforeLoad', (event) => {
      let hit: KeyofAccountBusiness | undefined
      if (event.pathChanged && (hit = AllowPathnames[event.toLocation.pathname])) {
        console.debug('Navigating to business route, writing memory route if enabled:', hit)
        writeMemoryRouteIfEnabled(AccountBusiness[hit])
      }
    })
  }, [])

  return (
    <EnvironmentProvider environment={environment}>
      <ThemeProvider
        themeData={themeData}
        themeStore={themeStore}
        isSupportedMica={environment.windows?.isWindows11}
      >
        <MetadataProvider>
          <AppLayout>
            <UpdaterAlert />
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </AppLayout>
          <ReactQueryDevtools />
        </MetadataProvider>
      </ThemeProvider>
    </EnvironmentProvider>
  )
}
