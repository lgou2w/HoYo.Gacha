import { QueryClient } from '@tanstack/react-query'

// Global QueryClient instance with default options
const queryClient = new QueryClient({
  defaultOptions: {
    // HACK: By default, all queries and mutations are unaffected by network.
    //   For special cases, please override these options in the specific.
    queries: {
      networkMode: 'always',
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      networkMode: 'always',
      retry: false,
    },
  },
})

export default queryClient
