import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, Option } from '@fluentui/react-components'
import { LocalLanguageRegular } from '@fluentui/react-icons'
import Locale from '@/components/UI/Locale'
import { KnownLanguages, Language, SupportedLanguages } from '@/i18n/locales'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'

export default function SettingsOptionsGeneralLanguage () {
  const { i18n } = useTranslation()

  return (
    <SettingsOptionsItem
      icon={<LocalLanguageRegular />}
      title={<Locale mapping={['Pages.Settings.Options.General.Language.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.General.Language.Subtitle']} />}
      action={(
        <Dropdown
          defaultSelectedOptions={[i18n.language]}
          onOptionSelect={(_, data) => i18n.changeLanguage(data.optionValue)}
          value={KnownLanguages[i18n.language as Language].text}
          style={{ minWidth: '12.5rem' }}
        >
          {SupportedLanguages.map((language) => (
            <Option key={language} value={language}>
              {KnownLanguages[language].text}
            </Option>
          ))}
        </Dropdown>
      )}
    />
  )
}
