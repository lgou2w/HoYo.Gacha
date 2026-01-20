import EN_US from './en-us'
import ZH_HANS from './zh-hans'
import ZH_HANT from './zh-hant'

export const KnownLanguages = {
  [EN_US.code]: EN_US,
  [ZH_HANS.code]: ZH_HANS,
  [ZH_HANT.code]: ZH_HANT,
} as const

export type Language = keyof typeof KnownLanguages
export const SupportedLanguages = Object.keys(KnownLanguages) as Language[]
export const DefaultLanguage = SupportedLanguages[0] || EN_US.code

export function isChinese (
  language: Language | string,
): language is typeof ZH_HANS.code | typeof ZH_HANT.code {
  return language === ZH_HANS.code
    || language === ZH_HANT.code
}
