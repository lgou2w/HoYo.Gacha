import { initReactI18next } from 'react-i18next'
import i18n, { changeLanguage } from 'i18next'
import { DefaultLanguage, KnownLanguages, SupportedLanguages } from './locales'
import { LanguageDetectorModule } from './modules'

// eslint-disable-next-line import/no-named-as-default-member
i18n
  .use(LanguageDetectorModule)
  .use(initReactI18next)
  .init({
    debug: import.meta.env.DEV,
    load: 'currentOnly',
    defaultNS: 'Common',
    fallbackLng: DefaultLanguage,
    supportedLngs: SupportedLanguages,
    interpolation: { escapeValue: false },
    resources: KnownLanguages,
  })

export default i18n
export * from './locales'
export * from './hooks'

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  var __CHANGE_LANGUAGE__: (language: string) => void
}

if (!globalThis.__CHANGE_LANGUAGE__) {
  globalThis.__CHANGE_LANGUAGE__ = changeLanguage
}
