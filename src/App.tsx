import React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { zhCN } from '@mui/material/locale'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import { StatefulAccountsProvider } from './hooks/accounts'
import AppSidebar from './components/sidebar'
import AppContent from './components/content'
import AppRoutes from './routes'
import './assets/index.css'

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
        <StatefulAccountsProvider>
          <AppSidebar />
          <AppContent>
            <AppRoutes />
          </AppContent>
        </StatefulAccountsProvider>
      </Box>
    </ThemeProvider>
  )
}
