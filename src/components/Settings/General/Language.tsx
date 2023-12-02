import React from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@fluentui/react-components'
import { LocalLanguageRegular } from '@fluentui/react-icons'
import Locale from '@/components/Core/Locale'
import SettingsGroupItem from '@/components/Settings/GroupItem'
import { SupportedLanguages } from '@/locales/declares'

export default function SettingsGroupItemLanguage () {
  const { i18n } = useTranslation()

  return (
    <SettingsGroupItem
      icon={<LocalLanguageRegular />}
      title={<Locale mapping={['components.settings.general.language.title']} />}
      subtitle={<Locale mapping={['components.settings.general.language.subtitle']} />}
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
              mapping={[`components.settings.general.language.${language}`]}
            />
          ))}
        </Select>
      )}
    />
  )
}
