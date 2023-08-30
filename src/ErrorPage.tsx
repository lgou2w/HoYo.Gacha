import React from 'react'
import { useRouteError } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function ErrorPage () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error = useRouteError() as any
  console.error(error)
  // TODO: Error page

  return (
    <Box padding={2}>
      <Typography variant="h5">Oops!</Typography>
      <Typography gutterBottom>Sorry, an unexpected error has occurred.</Typography>
      <Typography>
        <pre>{error.stack || error.statusText || error.message}</pre>
      </Typography>
    </Box>
  )
}
