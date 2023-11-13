import { Resource } from 'i18next'
import enUS from './en-US'
import zhHans from './zh-Hans'
import zhHant from './zh-Hant'

export const KnownLanguages = {
  'en-US': { translation: enUS },
  'zh-Hans': { translation: zhHans },
  'zh-Hant': { translation: zhHant }
} as const satisfies Resource

export type Language = keyof typeof KnownLanguages
export const SupportedLanguages = Object.keys(KnownLanguages) as Language[]
export const DefaultLanguage = SupportedLanguages[0] || 'en-US'
