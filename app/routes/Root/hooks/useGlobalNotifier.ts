import useNotifier from './useNotifier'

export * from './useNotifier'
export const GlobalNotifierId = 'global-toaster'
export default function useGlobalNotifier () {
  return useNotifier(GlobalNotifierId)
}
