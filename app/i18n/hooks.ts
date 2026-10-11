import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TFunction } from 'i18next'
import dayjs from '@/utilities/dayjs'
import { KnownLanguages, Language } from './locales'

export interface LanguageMetadata {
  language: Language
  constants: (typeof KnownLanguages)[Language]['constants']
  dayjs: (...args: Parameters<typeof dayjs>) => ReturnType<typeof dayjs>
}

/**
 * Build language-bound metadata (dayjs factory + constants).
 * Throws if the language is not supported.
 */
export function languageMetadata (language: Language | string): LanguageMetadata {
  const languageRef = KnownLanguages[language as Language]
  if (!languageRef) {
    throw new Error(`Unsupported language: ${language}`)
  }

  const { constants } = languageRef
  const locale = constants.dayjs

  return {
    language: language as Language,
    constants,
    dayjs: (...args) => dayjs(...args).locale(locale),
  }
}

export enum KnownI18nNs {
  Common = 'Common',
  RootPage = 'RootPage',
  HomePage = 'HomePage',
  GachaPage = 'GachaPage',
  SettingsPage = 'SettingsPage',
}

export interface UseI18nOptions {
  /** Namespace passed to `useTranslation`. */
  ns?: KnownI18nNs
  /** Optional prefix bound to `t`, so callers can use short keys. */
  scope?: string
}

export interface UseI18n {
  /** Scoped `t` function; stable across renders when language/scope unchanged. */
  t: TFunction
  /** Current language. */
  language: Language
  /** Language-specific constants (dayjs locale name, etc.). */
  constants: LanguageMetadata['constants']
  /** Language-bound dayjs factory. */
  dayjs: LanguageMetadata['dayjs']
  /** Change the current language. */
  changeLanguage: (language: string) => Promise<unknown>
}

export function useI18n (options?: UseI18nOptions): UseI18n {
  const { ns, scope } = options || {}
  const { i18n, t } = useTranslation(ns)
  const language = i18n.language

  // Language metadata, only recomputed when language changes.
  const metadata = useMemo(
    () => languageMetadata(language),
    [language],
  )

  // Scoped `t`, stable across renders.
  const scopedT = useMemo<TFunction>(() => {
    if (!scope) {
      return t
    }

    const scoped = (key: string, opts?: Parameters<TFunction>[1]) =>
      (t as (key: string, options?: Parameters<TFunction>[1]) => string)(`${scope}.${key}`, opts)

    return Object.assign(scoped, t) as TFunction
  }, [t, scope])

  const changeLanguage = useMemo(
    () => (language: string) => i18n.changeLanguage(language),
    [i18n],
  )

  return useMemo<UseI18n>(() => ({
    t: scopedT,
    language: metadata.language,
    constants: metadata.constants,
    dayjs: metadata.dayjs,
    changeLanguage,
  }), [scopedT, metadata, changeLanguage])
}
