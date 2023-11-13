import React from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@fluentui/react-components'
import { LocalLanguageRegular } from '@fluentui/react-icons'
import SettingsGroupItem from '@/components/Routes/Settings/GroupItem'
import { SupportedLanguages } from '@/locales/Declares'

export default function SettingsGroupItemLanguage () {
  const { t, i18n } = useTranslation()

  return (
    <SettingsGroupItem
      icon={<LocalLanguageRegular />}
      title={t('components.routes.settings.general.language.title')}
      subtitle={t('components.routes.settings.general.language.subtitle')}
      action={(
        <Select
          value={i18n.language}
          onChange={(_, data) => i18n.changeLanguage(data.value)}
        >
          {SupportedLanguages.map((language) => (
            <option key={language} value={language}>
              {t(`components.routes.settings.general.language.${language}`)}
            </option>
          ))}
        </Select>
      )}
    />
  )
}
