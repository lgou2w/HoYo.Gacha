import React, { PropsWithChildren } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import AppNavbar from '@/components/navbar'

export default function AppContent (props: PropsWithChildren) {
  return (
    <Box component="main" sx={{ flexGrow: 1, height: '100vh' }}>
      <AppNavbar />
      <Container maxWidth={false} sx={{ padding: 2 }} disableGutters>
        {props.children}
      </Container>
    </Box>
  )
}
