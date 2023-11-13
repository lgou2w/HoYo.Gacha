import React from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@fluentui/react-components'
import { LocalLanguageRegular } from '@fluentui/react-icons'
import SettingsSectionGroupItem from '@/components/Routes/Settings/Section/GroupItem'
import { SupportedLanguages } from '@/locales/Declares'

export default function SettingsSectionGroupItemLanguage () {
  const { t, i18n } = useTranslation()

  return (
    <SettingsSectionGroupItem
      icon={<LocalLanguageRegular />}
      title={t('routes.settings.general.language.title')}
      subtitle={t('routes.settings.general.language.subtitle')}
      action={(
        <Select
          value={i18n.language}
          onChange={(_, data) => i18n.changeLanguage(data.value)}
        >
          {SupportedLanguages.map((language) => (
            <option key={language} value={language}>
              {t(`routes.settings.general.language.${language}`)}
            </option>
          ))}
        </Select>
      )}
    />
  )
}
