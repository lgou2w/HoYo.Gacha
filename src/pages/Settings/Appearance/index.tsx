import React from 'react'
import Locale from '@/components/Commons/Locale'
import SettingsGroup from '@/pages/Settings/Group'
import SettingsGroupItemThemeColor from './ThemeColor'
import SettingsGroupItemThemeSpace from './ThemeSpace'
import SettingsGroupItemThemeZoom from './ThemeZoom'

export default function SettingsGroupAppearance () {
  return (
    <SettingsGroup title={<Locale mapping={['Pages.Settings.Appearance.Title']} />}>
      <SettingsGroupItemThemeSpace />
      <SettingsGroupItemThemeColor />
      <SettingsGroupItemThemeZoom />
    </SettingsGroup>
  )
}
