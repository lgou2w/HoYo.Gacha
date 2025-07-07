import React from 'react'
import Locale from '@/components/Locale'
import SettingsOptionsGroup from '@/pages/Settings/Options/OptionsGroup'
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
