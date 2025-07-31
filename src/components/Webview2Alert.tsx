import React, { Suspense, useEffect } from 'react'
import { Link } from '@fluentui/react-components'
import { Await } from '@tanstack/react-router'
import { webview2Version } from '@/api/commands/core'
import useI18n from '@/hooks/useI18n'
import useNotifier from '@/hooks/useNotifier'
import Locale from './Locale'

export default function Webview2Alert () {
  return (
    <Suspense>
      <Await promise={webview2Version()}>
        {(version) => isSupported(version) ? null : <Webview2AlertInner />}
      </Await>
    </Suspense>
  )
}

const MinVersionMajor = 121

let isShow = false

function Webview2AlertInner () {
  const i18n = useI18n()
  const notifier = useNotifier()

  useEffect(() => {
    if (isShow) {
      return
    }

    isShow = true
    notifier.warning(i18n.t('Webview2Alert.Title'), {
      body: (
        <Locale mapping={['Webview2Alert.Subtitle', { min: MinVersionMajor }]} childrenPosition="after">
          {'\u00A0'}
          <Link href="https://developer.microsoft.com/microsoft-edge/webview2/" target="_blank" rel="noreferrer">
            Microsoft Edge Webview2
          </Link>
        </Locale>
      ),
      timeout: 30 * 1000,
      dismissible: true,
      position: 'bottom-end',
      pauseOnHover: true,
      pauseOnWindowBlur: true,
    })
  }, [i18n, notifier])

  return null
}

function isSupported (version: string): boolean {
  const currentVersionMajor = version.split('.')[0] as string | undefined
  if (!currentVersionMajor || !Number.isSafeInteger(+currentVersionMajor)) {
    console.warn('Webview2 version is not valid:', version)
    return false
  }

  return +currentVersionMajor >= MinVersionMajor
}
