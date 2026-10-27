import { Spinner } from '@fluentui/react-components'
import { createRoute, redirect } from '@tanstack/react-router'
import { resolveBusinessRouteRedirect } from '@/routes/Root/hooks/useBusinessRoutes'
import rootRoute from '@/routes/Root/route'
import HomePage from './page'

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  shouldReload: false,
  component: HomePage,
  pendingComponent: Spinner,
  async loader () {
    console.debug(
      '%c===== HomePage route loader =====',
      'color:white; background-color:orange; font-weight: bold;',
    )
  },
  async beforeLoad () {
    if (!isFirstRun) {
      return
    }

    consumeFirstRun()
    const memoryRoute = await resolveBusinessRouteRedirect()
    if (memoryRoute) {
      // `replace` avoids leaving `/` in the history,
      // which would otherwise re-trigger this redirect on back navigation.
      throw redirect({ to: memoryRoute, replace: true })
    }
  },
})

// Only attempt the memory-route redirect once per app launch.
// Restore across HMR: module-level state is reset on hot replacement.
let isFirstRun = true

if (import.meta.hot) {
  isFirstRun = import.meta.hot.data.isFirstRun ?? true
  import.meta.hot.data.isFirstRun = isFirstRun
}

function consumeFirstRun (): void {
  isFirstRun = false
  if (import.meta.hot) {
    import.meta.hot.data.isFirstRun = false
  }
}

export default homeRoute
