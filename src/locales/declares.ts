import { Resource } from 'i18next'
import EN_US from './en-US'
import ZH_HANS from './zh-Hans'
import ZH_HANT from './zh-Hant'

export const KnownLanguages = {
  'en-US': { translation: EN_US },
  'zh-Hans': { translation: ZH_HANS },
  'zh-Hant': { translation: ZH_HANT }
} as const satisfies Resource

export type Language = keyof typeof KnownLanguages
export const SupportedLanguages = Object.keys(KnownLanguages) as Language[]
export const DefaultLanguage = SupportedLanguages[0] || 'en-US'
