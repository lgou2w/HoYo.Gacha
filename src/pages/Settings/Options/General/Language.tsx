import React from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@fluentui/react-components'
import { LocalLanguageRegular } from '@fluentui/react-icons'
import SettingsOptionsItem from '@/components/Settings/OptionsItem'
import Locale from '@/components/UI/Locale'
import { SupportedLanguages } from '@/i18n/locales'

export default function SettingsOptionsGeneralLanguage () {
  const { i18n } = useTranslation()

  return (
    <SettingsOptionsItem
      icon={<LocalLanguageRegular />}
      title={<Locale mapping={['Pages.Settings.Options.General.Language.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.General.Language.Subtitle']} />}
      action={(
        <Select
          value={i18n.language}
          onChange={(_, data) => i18n.changeLanguage(data.value)}
        >
          {SupportedLanguages.map((language) => (
            <Locale
              key={language}
              component="option"
              value={language}
              mapping={[`Pages.Settings.Options.General.Language.${language}`]}
            />
          ))}
        </Select>
      )}
    />
  )
}
