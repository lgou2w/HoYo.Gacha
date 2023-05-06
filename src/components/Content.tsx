import React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

export default function AppContent (props: React.PropsWithChildren) {
  return (
    <Box component="main" display="flex" flex={1} padding={2}>
      <Stack direction="column" spacing={2} flexGrow={1}>
        {props.children}
      </Stack>
    </Box>
  )
}
