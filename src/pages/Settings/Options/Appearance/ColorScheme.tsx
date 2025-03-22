import React from 'react'
import { DarkThemeRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import Switch from '@/components/UI/Switch'
import { useColorScheme } from '@/hooks/useThemeContext'
import { Dark } from '@/interfaces/Theme'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'
import capitalize from '@/utilities/capitalize'

export default function SettingsOptionsAppearanceColorScheme () {
  const { colorScheme, toggle } = useColorScheme()

  return (
    <SettingsOptionsItem
      icon={<DarkThemeRegular style={{ transform: 'rotate(180deg)' }} />}
      title={<Locale mapping={['Pages.Settings.Options.Appearance.ColorScheme.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.Appearance.ColorScheme.Subtitle']} />}
      action={(
        <Switch
          labelPosition="before"
          label={<Locale mapping={[`Pages.Settings.Options.Appearance.ColorScheme.${capitalize(colorScheme)}`]} />}
          checked={colorScheme === Dark}
          onChange={() => toggle()}
        />
      )}
    />
  )
}
