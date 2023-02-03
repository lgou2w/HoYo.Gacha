import React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { zhCN } from '@mui/material/locale'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import AppNavbar from './components/navbar'
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
        <AppNavbar />
        <AppSidebar />
        <AppContent>
          <AppRoutes />
        </AppContent>
      </Box>
    </ThemeProvider>
  )
}
