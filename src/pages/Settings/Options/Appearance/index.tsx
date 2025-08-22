import React from 'react'
import Locale from '@/components/Locale'
import SettingsOptionsGroup from '@/pages/Settings/Options/OptionsGroup'
import SettingsOptionsAppearanceColorScheme from './ColorScheme'
import SettingsOptionsAppearanceFont from './Font'
import SettingsOptionsAppearanceNamespace from './Namespace'
import SettingsOptionsAppearanceScaleLevel from './ScaleLevel'

export default function SettingsOptionsAppearance () {
  return (
    <SettingsOptionsGroup
      title={<Locale mapping={['Pages.Settings.Options.Appearance.Title']} />}
    >
      <SettingsOptionsAppearanceNamespace />
      <SettingsOptionsAppearanceColorScheme />
      <SettingsOptionsAppearanceScaleLevel />
      <SettingsOptionsAppearanceFont />
    </SettingsOptionsGroup>
  )
}
