import { AppToasterId } from '@/pages/Root/components/AppNotifier'
import useNotifier from './useNotifier'

export * from './useNotifier'
export default function useAppNotifier () {
  return useNotifier(AppToasterId)
}
