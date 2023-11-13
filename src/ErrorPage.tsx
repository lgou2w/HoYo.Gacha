import React from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteError } from 'react-router-dom'
import { Subtitle1, Body2, Text } from '@fluentui/react-components'

export default function ErrorPage () {
  const { t } = useTranslation()
  const error = useRouteError() as Record<string, unknown>
  console.error('Oops!', error)

  return (
    <div style={{ padding: '1rem' }}>
      <Subtitle1 as="h5" block>{t('errorPage.title')}</Subtitle1>
      <br />
      <Body2 as="h6" block>{t('errorPage.subtitle')}</Body2>
      <br />
      <Text as="pre" font="monospace" style={{ whiteSpace: 'pre' }} block>
        {(error.stack || error.statusText || error.message) as string | undefined}
      </Text>
    </div>
  )
}
