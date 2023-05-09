import React from 'react'
import Box from '@mui/material/Box'

export default function Content (props: React.PropsWithChildren) {
  return (
    <Box component="main" display="flex" flexDirection="column" width="100%">
      {props.children}
    </Box>
  )
}
