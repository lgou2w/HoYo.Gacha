import React, { ComponentRef, Fragment, MouseEventHandler, useCallback, useRef, useState } from 'react'
import { Button } from '@fluentui/react-components'
import { ArrowClockwiseRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import Updater from '@/components/Updater'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'

export default function SettingsOptionsAboutUpdater () {
  const [busy, setBusy] = useState(false)
  const updaterRef = useRef<ComponentRef<typeof Updater>>(null)

  const handleClick = useCallback<MouseEventHandler>(() => {
    if (!updaterRef.current) {
      return
    }

    setBusy(true)
    updaterRef.current.start()
  }, [])

  return (
    <SettingsOptionsItem
      icon={<ArrowClockwiseRegular />}
      title={<Locale mapping={['Pages.Settings.Options.About.Updater.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.About.Updater.Subtitle']} />}
      action={(
        <Fragment>
          <Locale
            component={Button}
            appearance="primary"
            mapping={['Pages.Settings.Options.About.Updater.CheckBtn']}
            onClick={handleClick}
            disabled={busy}
          />
          <Updater
            ref={updaterRef}
            onCompleted={() => setBusy(false)}
            onError={() => setBusy(false)}
            manually
          />
        </Fragment>
      )}
    />
  )
}
