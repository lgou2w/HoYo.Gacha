import EN_US from './en-US'
import ZH_HANS from './zh-Hans'
import ZH_HANT from './zh-Hant'

export const KnownLanguages = {
  [EN_US.language]: EN_US,
  [ZH_HANS.language]: ZH_HANS,
  [ZH_HANT.language]: ZH_HANT,
} as const

export type Language = keyof typeof KnownLanguages
export const SupportedLanguages = Object.keys(KnownLanguages) as Language[]
export const DefaultLanguage = SupportedLanguages[0] || EN_US.language
