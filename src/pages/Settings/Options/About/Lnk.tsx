import React, { MouseEventHandler, useCallback } from 'react'
import { Button } from '@fluentui/react-components'
import { LinkMultipleRegular } from '@fluentui/react-icons'
import { createAppLnk } from '@/api/commands/core'
import Locale from '@/components/Locale'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'

export default function SettingsOptionsAboutLnk () {
  const onCreate = useCallback<MouseEventHandler>(async () => {
    await createAppLnk()
  }, [])

  return (
    <SettingsOptionsItem
      icon={<LinkMultipleRegular />}
      title={<Locale mapping={['Pages.Settings.Options.About.Lnk.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.About.Lnk.Subtitle']} />}
      action={(
        <Locale
          component={Button}
          mapping={['Pages.Settings.Options.About.Lnk.CreateBtn']}
          onClick={onCreate}
        />
      )}
    />
  )
}
