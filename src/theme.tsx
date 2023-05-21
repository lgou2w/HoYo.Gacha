import React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { zhCN } from '@mui/material/locale'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'

if (import.meta.env.DEV) {
  import('@/assets/global.css')
} else if (import.meta.env.PROD) {
  import('@/assets/fontmin/index.css')
}

const theme = createTheme({
  typography: {
    fontFamily: '汉仪文黑-85W'
  }
}, zhCN)

export default function Theme (props: React.PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <Box display="flex">
        <CssBaseline />
        {props.children}
      </Box>
    </ThemeProvider>
  )
}
