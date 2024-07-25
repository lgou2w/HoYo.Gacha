import { initReactI18next } from 'react-i18next'
import i18n from 'i18next'
import { DefaultLanguage, KnownLanguages, SupportedLanguages } from './locales'
import { TauriLanguageDetectorModule } from './modules'

i18n
  .use(TauriLanguageDetectorModule)
  .use(initReactI18next)
  .init({
    debug: import.meta.env.DEV,
    load: 'currentOnly',
    fallbackLng: DefaultLanguage,
    supportedLngs: SupportedLanguages,
    interpolation: { escapeValue: false },
    resources: KnownLanguages
  })

export default i18n
