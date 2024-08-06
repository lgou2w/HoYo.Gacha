import React from 'react'
import { Button } from '@fluentui/react-components'
import { ChevronDownRegular, CloudDatabaseRegular } from '@fluentui/react-icons'
import SettingsOptionsItem from '@/components/Settings/OptionsItem'
import Locale from '@/components/UI/Locale'

// TODO: Cloud storage

export default function SettingsOptionsCloudTest () {
  return (
    <SettingsOptionsItem
      icon={<CloudDatabaseRegular />}
      title={<Locale mapping={['Pages.Settings.Options.Cloud.Test.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.Cloud.Test.Subtitle']} />}
      action={(
        <Button appearance="transparent" icon={<ChevronDownRegular />} />
      )}
    />
  )
}
