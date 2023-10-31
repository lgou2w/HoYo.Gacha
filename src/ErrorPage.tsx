import React from 'react'
import { useRouteError } from 'react-router-dom'

export default function ErrorPage () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error = useRouteError() as any
  console.error(error)

  return (
    <div>
      <h5>Oops!</h5>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <pre>{error.stack || error.statusText || error.message}</pre>
      </p>
    </div>
  )
}
