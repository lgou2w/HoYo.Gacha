import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { KnownLanguages, Language } from '@/i18n/locales'
import dayjs from '@/utilities/dayjs'

export default function useI18n () {
  const { i18n, t } = useTranslation()
  const extended = useMemo(() => {
    const language = i18n.language as Language
    const constants = KnownLanguages[language].constants
    return {
      language,
      constants,
      dayjs: (...args: Parameters<typeof dayjs>) => {
        return dayjs(...args).locale(constants.dayjs)
      },
    }
  }, [i18n.language])

  return {
    t,
    changeLanguage: i18n.changeLanguage,
    ...extended,
  }
}
