import React from 'react'
import { Dropdown, Option } from '@fluentui/react-components'
import { LocalLanguageRegular } from '@fluentui/react-icons'
import Locale from '@/components/Locale'
import useI18n from '@/hooks/useI18n'
import { KnownLanguages, SupportedLanguages } from '@/i18n/locales'
import SettingsOptionsItem from '@/pages/Settings/Options/OptionsItem'

export default function SettingsOptionsGeneralLanguage () {
  const i18n = useI18n()

  return (
    <SettingsOptionsItem
      icon={<LocalLanguageRegular />}
      title={<Locale mapping={['Pages.Settings.Options.General.Language.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.General.Language.Subtitle']} />}
      action={(
        <Dropdown
          defaultSelectedOptions={[i18n.language]}
          onOptionSelect={(_, data) => i18n.changeLanguage(data.optionValue)}
          value={i18n.constants.text}
          style={{ minWidth: '12.5rem' }}
        >
          {SupportedLanguages.map((language) => (
            <Option key={language} value={language}>
              {KnownLanguages[language].constants.text}
            </Option>
          ))}
        </Dropdown>
      )}
    />
  )
}
