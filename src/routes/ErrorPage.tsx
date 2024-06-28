import React from 'react'
import { useRouteError } from 'react-router-dom'
import { Subtitle1, Body2, Text } from '@fluentui/react-components'
import Locale from '@/components/Commons/Locale'

export default function ErrorPage () {
  const error = useRouteError() as Record<string, unknown>
  console.error('Oops!', error)

  return (
    <div style={{ padding: '1rem' }}>
      <Locale component={Subtitle1} as="h5" block mapping={['ErrorPage.Title']} />
      <br />
      <Locale component={Body2} as="h6" block mapping={['ErrorPage.Subtitle']} />
      <br />
      <Text as="pre" font="monospace" style={{ whiteSpace: 'pre' }} block>
        {(error.stack || error.statusText || error.message) as string | undefined}
      </Text>
    </div>
  )
}
