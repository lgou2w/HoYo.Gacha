import useGlobalStyles from './useGlobalStyles'
import usePreventRefresh from './usePreventRefresh'

// Hook method for app initialization

export default function useAppInit () {
  useGlobalStyles()
  usePreventRefresh()
}
