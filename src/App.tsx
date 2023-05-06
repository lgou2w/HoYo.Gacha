import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { zhCN } from '@mui/material/locale'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import AppLayout from '@/layout'
import AppRoutes from '@/routes'
import '@/assets/global.css'

const client = new QueryClient()
const theme = createTheme({
  typography: {
    fontFamily: '汉仪旗黑-55S'
  }
}, zhCN)

export default function App () {
  // HACK: Disable context menu in production
  React.useEffect(() => {
    if (import.meta.env.PROD) {
      const listener = (evt: Event) => evt.preventDefault()
      document.addEventListener('contextmenu', listener)
      return () => { document.removeEventListener('contextmenu', listener) }
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <Box display="flex">
        <CssBaseline />
        <QueryClientProvider client={client}>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
          <ReactQueryDevtools position="bottom-right" />
        </QueryClientProvider>
      </Box>
    </ThemeProvider>
  )
}
