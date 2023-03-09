import React, { PropsWithChildren } from 'react'
import Stack from '@mui/material/Stack'

export default function Page (props: PropsWithChildren) {
  return (
    <Stack component="div" className="page" flexDirection="column" gap={3}>
      {props.children}
    </Stack>
  )
}
