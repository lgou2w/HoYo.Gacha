import React from 'react'
import { Dropdown, Option } from '@fluentui/react-components'
import { DarkThemeRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { useColorScheme } from '@/hooks/useThemeContext'
import { ColorScheme, Dark, Light } from '@/interfaces/Theme'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'
import capitalize from '@/utilities/capitalize'

const Auto = 'auto'

export default function SettingsOptionsAppearanceColorScheme () {
  const i18n = useI18n()
  const { colorScheme, change } = useColorScheme()
  const currentValue = colorScheme || Auto

  return (
    <SettingsOptionsItem
      icon={<DarkThemeRegular style={{ transform: 'rotate(180deg)' }} />}
      title={<Locale mapping={['Pages.Settings.Options.Appearance.ColorScheme.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.Appearance.ColorScheme.Subtitle']} />}
      action={(
        <Dropdown
          value={i18n.t(`Pages.Settings.Options.Appearance.ColorScheme.${capitalize(currentValue)}`)}
          defaultSelectedOptions={[currentValue]}
          onOptionSelect={(_, data) => {
            const optionValue = data.optionValue as ColorScheme | typeof Auto
            change(optionValue !== Auto ? optionValue : null)
          }}
          style={{ minWidth: '10rem' }}
        >
          {[Auto, Light, Dark].map((value) => (
            <Option key={value} value={value}>
              {i18n.t(`Pages.Settings.Options.Appearance.ColorScheme.${capitalize(value)}`)}
            </Option>
          ))}
        </Dropdown>
      )}
    />
  )
}
