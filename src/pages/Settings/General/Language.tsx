import React from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@fluentui/react-components'
import { LocalLanguageRegular } from '@fluentui/react-icons'
import Locale from '@/components/Commons/Locale'
import { SupportedLanguages } from '@/locales/declares'
import SettingsGroupItem from '@/pages/Settings/GroupItem'

export default function SettingsGroupItemLanguage () {
  const { i18n } = useTranslation()

  return (
    <SettingsGroupItem
      icon={<LocalLanguageRegular />}
      title={<Locale mapping={['Pages.Settings.General.Language.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.General.Language.Subtitle']} />}
      action={(
        <Select
          value={i18n.language}
          onChange={(_, data) => i18n.changeLanguage(data.value)}
        >
          {SupportedLanguages.map((language) => (
            <Locale
              component="option"
              key={language}
              value={language}
              mapping={[`Pages.Settings.General.Language.${language}`]}
            />
          ))}
        </Select>
      )}
    />
  )
}
