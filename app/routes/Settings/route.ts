import { Spinner } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
import rootRoute from '@/routes/Root/route'
import SettingsPage from './page'

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/Settings',
  shouldReload: false,
  component: SettingsPage,
  pendingComponent: Spinner,
  async loader () {
    console.debug(
      '%c===== SettingsPage route loader =====',
      'color:white; background-color:orange; font-weight: bold;',
    )
  },
})

export default settingsRoute
