import { Spinner } from '@fluentui/react-components'
import { createRoute, redirect } from '@tanstack/react-router'
import { resolveMemoryRouteRedirect } from '@/pages/Root/queries/business'
import rootRoute from '@/pages/Root/route'
import HomeLayout from './layout'

let isFirstRun = true

// Ensure that the first run state is preserved across hot module replacements (HMR) during development. This allows us to maintain the logic that redirects to the memory route only on the first launch of the home page, even when the module is reloaded.
if (import.meta.hot) {
  if (typeof import.meta.hot.data.isFirstRun === 'undefined') {
    import.meta.hot.data.isFirstRun = true
  }

  isFirstRun = import.meta.hot.data.isFirstRun
  console.debug('HMR: Restored isFirstRun state:', isFirstRun)
}

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  shouldReload: false,
  component: HomeLayout,
  pendingComponent: Spinner,
  async loader () {
    console.debug('===== Home Route Loader =====')

    // HACK: When available, the first launch on the home page will redirect to the memory route.
    let memoryRoute: string | undefined
    if (isFirstRun && (memoryRoute = await resolveMemoryRouteRedirect())) {
      if (import.meta.hot) {
        import.meta.hot.data.isFirstRun = false
      }
      isFirstRun = false

      console.debug('Redirecting to memory route:', memoryRoute)
      return redirect({
        to: memoryRoute,
      })
    }
  },
})

export default homeRoute
