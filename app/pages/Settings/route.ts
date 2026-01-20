import { Spinner } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
import rootRoute from '@/pages/Root/route'
import SettingsLayout from './layout'

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/Settings',
  shouldReload: false,
  component: SettingsLayout,
  pendingComponent: Spinner,
  async loader () {
    console.debug('===== Settings Route Loader =====')
  },
})

export default settingsRoute
