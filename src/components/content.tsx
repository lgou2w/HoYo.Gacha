import React, { PropsWithChildren } from 'react'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'

export default function AppContent (props: PropsWithChildren) {
  return (
    <Box component="main" sx={{ flexGrow: 1, height: '100vh' }}>
      <Toolbar disableGutters />
      <Container maxWidth={false} sx={{ padding: 2 }} disableGutters>
        {props.children}
      </Container>
    </Box>
  )
}
