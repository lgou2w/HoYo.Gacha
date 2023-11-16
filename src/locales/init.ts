import { initReactI18next } from 'react-i18next'
import { locale as tauriLocale } from '@tauri-apps/api/os'
import i18n, { LanguageDetectorAsyncModule } from 'i18next'
import { KnownLanguages, SupportedLanguages, DefaultLanguage, Language } from './declares'

console.debug('Supported languages:', SupportedLanguages)
console.debug('Default language:', DefaultLanguage)

const LocalStorageKey = 'HG_LANGUAGE'

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

      let locale: string | null = null
      try {
        locale = await tauriLocale()
      } catch (e) {
        console.error('Failed to get Tauri locale:', e)
      }

      return locale
        ? mappingTauriLocale(locale) || DefaultLanguage
        : DefaultLanguage
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

// https://tauri.app/v1/api/js/os/#locale
// https://github.com/1Password/sys-locale/blob/main/src/windows.rs
// https://learn.microsoft.com/windows/win32/api/winnls/nf-winnls-getuserpreferreduilanguages
// https://en.wikipedia.org/wiki/Locale_(computer_software)#Specifics_for_Microsoft_platforms

const KnownLocaleMappings: Array<[Language, { matches: RegExp | string[] }]> = [
  ['en-US', {
    matches: /^en/
  }],
  ['zh-Hans', {
    matches: ['zh-CN', 'zh-SG']
  }],
  ['zh-Hant', {
    matches: ['zh-HK', 'zh-TW', 'zh-MO']
  }]
]

function mappingTauriLocale (locale: string): Language | undefined {
  // If the locale matches the supported languages, then mapping is not required.
  if (SupportedLanguages.includes(locale as Language)) {
    return locale as Language
  }

  function matchesHit (locale: string, matches: RegExp | string[]) {
    if (matches instanceof RegExp) {
      return matches.test(locale)
    } else if (Array.isArray(matches)) {
      return matches.includes(locale)
    } else {
      return false
    }
  }

  const mapping = KnownLocaleMappings.find((mapping) => {
    const [language, { matches }] = mapping
    return language === locale || matchesHit(locale, matches)
  })

  if (!mapping) {
    console.warn(`Unsupported Tauri locale: ${locale}`)
    return undefined
  } else {
    const [language] = mapping
    console.debug(`Mapping Tauri locale: ${locale} -> ${language}`)
    return language
  }
}

export default i18n
