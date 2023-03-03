import React, { PropsWithChildren } from 'react'
import Box from '@mui/material/Box'

interface Props {
  value: number
  index: number
}

export default function GachaTab (props: PropsWithChildren<Props>) {
  return (
    <Box component="div" hidden={props.value !== props.index}>
      {props.children}
    </Box>
  )
}
