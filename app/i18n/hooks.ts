import { useMemo } from 'react'
import { useTranslation, withTranslation } from 'react-i18next'
import { KnownLanguages, Language } from '@/i18n'
import dayjs from '@/utilities/dayjs'

export function i18nDayjs (language: Language | string) {
  const languageRef = KnownLanguages[language as Language]
  if (!languageRef) {
    throw new Error(`Unsupported language: ${language}`)
  } else {
    return (...args: Parameters<typeof dayjs>) => dayjs(...args)
      .locale(languageRef.constants.dayjs)
  }
}

export function languageMetadata (language: Language | string) {
  const dayjs = i18nDayjs(language)

  // SAFETY
  const constants = KnownLanguages[language as Language].constants
  return {
    language: language as Language,
    constants,
    dayjs: (...args: Parameters<typeof dayjs>) => {
      return dayjs(...args).locale(constants.dayjs)
    },
  }
}

type UseI18nArgs = Parameters<typeof useTranslation>

export function useI18n (...args: UseI18nArgs) {
  const { i18n, t } = useTranslation(...args)
  const metadata = useMemo(
    () => languageMetadata(i18n.language),
    [i18n.language],
  )

  return {
    t,
    changeLanguage: i18n.changeLanguage,
    ...metadata,
  }
}

// #region: Ns withTranslation shorthands

export enum WithTransKnownNs {
  RootPage = 'RootPage',
  GachaPage = 'GachaPage',
  SettingsPage = 'SettingsPage',
}

export type { WithTranslation as WithTrans } from 'react-i18next'
export type withTrans
  = & typeof withTranslation
    & Record<WithTransKnownNs, ReturnType<typeof withTranslation>>

export const withTrans: withTrans = withTranslation as withTrans
Object.values(WithTransKnownNs).forEach((ns) => {
  withTrans[ns] = withTranslation.bind(undefined, ns)()
})

// #endregion

export type { TFunction } from 'i18next'
export { Trans } from 'react-i18next'
