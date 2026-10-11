import { Spinner } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
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
})

export default homeRoute
