import { initReactI18next } from 'react-i18next'
import { locale as tauriLocale } from '@tauri-apps/api/os'
import i18n, { LanguageDetectorAsyncModule } from 'i18next'
import { KnownLanguages, SupportedLanguages, DefaultLanguage, Language } from './declares'

console.debug('Supported languages:', SupportedLanguages)
console.debug('Default language:', DefaultLanguage)

const LocalStorageKey = 'HG_LOCALE'

i18n
  .use(<LanguageDetectorAsyncModule> {
    type: 'languageDetector',
    async: true,
    async detect () {
      const cache = window.localStorage.getItem(LocalStorageKey) as Language | null
      if (cache && SupportedLanguages.includes(cache)) {
        console.debug('Use cached user language:', cache)
        return cache
      } else if (cache) {
        console.warn('Invalid cached user language:', cache)
        window.localStorage.removeItem(LocalStorageKey)
      }

      if (!('__TAURI__' in window)) {
        console.warn('Not the Tauri runtime environment.')
        return DefaultLanguage
      }

      let tauriLng: string | null = null
      try {
        tauriLng = await tauriLocale()
      } catch (e) {
        console.error('Failed to get Tauri locale:', e)
      }

      return tauriLng || DefaultLanguage
    },
    cacheUserLanguage (lng) {
      console.debug('Cache user language:', lng)
      window.localStorage.setItem(LocalStorageKey, lng)
    }
  })
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
