import React from 'react'
import { CloudDatabaseRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import SettingsOptionsCollapse from '@/pages/Settings/Options/OptionsCollapse'

// TODO: Cloud storage

export default function SettingsOptionsCloudTest () {
  return (
    <SettingsOptionsCollapse
      icon={<CloudDatabaseRegular />}
      title={<Locale mapping={['Pages.Settings.Options.Cloud.Test.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.Cloud.Test.Subtitle']} />}
    >
      <span>come up soon</span>
    </SettingsOptionsCollapse>
  )
}
