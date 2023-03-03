import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { zhCN } from '@mui/material/locale'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import { StatefulSettingsProvider } from '@/hooks/useStatefulSettings'
import AppSidebar from '@/components/sidebar'
import AppContent from '@/components/content'
import AppRoutes from '@/routes'
import '@/assets/index.css'

const client = new QueryClient()
const theme = createTheme({
  typography: {
    fontFamily: '汉仪文黑-85w'
  }
}, zhCN)

export default function App () {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <QueryClientProvider client={client}>
          <StatefulSettingsProvider>
            <AppSidebar />
            <AppContent>
              <AppRoutes />
            </AppContent>
          </StatefulSettingsProvider>
          <ReactQueryDevtools position="bottom-right" />
        </QueryClientProvider>
      </Box>
    </ThemeProvider>
  )
}
