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

export const GachaLocales = [
  'de-de', 'en-us', 'es-es', 'fr-fr', 'id-id', 'it-it', 'ja-jp', 'ko-kr', 'pt-pt', 'ru-ru', 'th-th', 'tr-tr', 'vi-vn',
  'zh-cn', 'zh-tw',
] as const

export type SupportedGachaLocale = typeof GachaLocales[number]

export function preferredGachaLocale (language: Language): SupportedGachaLocale {
  switch (language) {
    case ZH_HANS.language:
      return 'zh-cn'
    case ZH_HANT.language:
      return 'zh-tw'
    default:
      return 'en-us'
  }
}
