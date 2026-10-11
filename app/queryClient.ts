import { QueryClient } from '@tanstack/react-query'

// Global QueryClient instance with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      refetchOnMount: true,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      retry: false,
    },
    mutations: {
      networkMode: 'always',
      retry: false,
    },
  },
})

export default queryClient
