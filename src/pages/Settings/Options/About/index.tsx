import React from 'react'
import SettingsOptionsGroup from '@/components/Settings/OptionsGroup'
import Locale from '@/components/UI/Locale'
import SettingsOptionsAboutSpecification from './Specification'
import SettingsOptionsAboutUpdater from './Updater'

export default function SettingsOptionsAbout () {
  return (
    <SettingsOptionsGroup
      title={<Locale mapping={['Pages.Settings.Options.About.Title']} />}
    >
      <SettingsOptionsAboutUpdater />
      <SettingsOptionsAboutSpecification />
    </SettingsOptionsGroup>
  )
}
