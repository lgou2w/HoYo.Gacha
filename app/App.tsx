import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import queryClient from '@/queryClient'
import router from '@/routes/router'
import '@/i18n'

export default function App () {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

// HACK: Vite v8.2+ attempts hot updates for non-component modules (e.g. queries,
// contexts) that are part of the import graph, instead of falling back to a full
// reload like v8.1.x did. For this app that leaves the router/queryClient in an
// inconsistent state and blanks the page. Rejecting the update here forces the
// change to bubble up to the entry point, which triggers a full reload — matching
// the old behavior. Remove this once Vite handles our module graph correctly.
if (import.meta.hot) {
  import.meta.hot.invalidate()
}
