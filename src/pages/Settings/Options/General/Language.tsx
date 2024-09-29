import React from 'react'
import { useTranslation } from 'react-i18next'
import { Dropdown, Option } from '@fluentui/react-components'
import { LocalLanguageRegular } from '@fluentui/react-icons'
import SettingsOptionsItem from '@/components/Settings/OptionsItem'
import Locale from '@/components/UI/Locale'
import { SupportedLanguages } from '@/i18n/locales'

export default function SettingsOptionsGeneralLanguage () {
  const { t, i18n } = useTranslation()

  return (
    <SettingsOptionsItem
      icon={<LocalLanguageRegular />}
      title={<Locale mapping={['Pages.Settings.Options.General.Language.Title']} />}
      subtitle={<Locale mapping={['Pages.Settings.Options.General.Language.Subtitle']} />}
      action={(
        <Dropdown
          defaultSelectedOptions={[i18n.language]}
          onOptionSelect={(_, data) => i18n.changeLanguage(data.optionValue)}
          value={t(`Pages.Settings.Options.General.Language.${i18n.language}`)}
          style={{ minWidth: '12.5rem' }}
        >
          {SupportedLanguages.map((language) => (
            <Locale
              key={language}
              component={Option}
              value={language}
              mapping={[`Pages.Settings.Options.General.Language.${language}`]}
            />
          ))}
        </Dropdown>
      )}
    />
  )
}
