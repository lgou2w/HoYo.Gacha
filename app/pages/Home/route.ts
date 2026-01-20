import { Spinner } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
import rootRoute from '@/pages/Root/route'
import HomeLayout from './layout'

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  shouldReload: false,
  component: HomeLayout,
  pendingComponent: Spinner,
  async loader () {
    console.debug('===== Home Route Loader =====')
  },
})

export default homeRoute
