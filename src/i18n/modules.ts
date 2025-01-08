import { LanguageDetectorAsyncModule } from 'i18next'
import { locale as localeFn } from '@/api/commands/core'
import { DefaultLanguage, KnownLanguages, Language, SupportedLanguages } from './locales'

export const TauriLanguageDetectorModuleLocalStorageKey = 'HG_LANGUAGE'
export const TauriLanguageDetectorModule: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  async detect (): Promise<string | readonly string[] | undefined> {
    const dirty = window.localStorage.getItem(TauriLanguageDetectorModuleLocalStorageKey)
    if (dirty && SupportedLanguages.includes(dirty as Language)) {
      console.debug('Use cached user language:', dirty)
      return dirty
    } else if (dirty) {
      console.warn('Invalid cached user language:', dirty)
      window.localStorage.removeItem(TauriLanguageDetectorModuleLocalStorageKey)
    }

    if (!('__TAURI__' in window)) {
      console.warn('Not the Tauri runtime environment.')
      return DefaultLanguage
    }

    let locale: string | null = null
    try {
      locale = await localeFn()
    } catch (e) {
      console.error('Failed to get Tauri locale:', e)
    }

    return locale
      ? mappingTauriLocale(locale) || DefaultLanguage
      : DefaultLanguage
  },
  cacheUserLanguage (lng: string): void | Promise<void> {
    console.debug('Cache user language:', lng)
    window.localStorage.setItem(TauriLanguageDetectorModuleLocalStorageKey, lng)
  },
}

// https://tauri.app/v1/api/js/os/#locale
// https://github.com/1Password/sys-locale/blob/main/src/windows.rs
// https://learn.microsoft.com/windows/win32/api/winnls/nf-winnls-getuserpreferreduilanguages
// https://en.wikipedia.org/wiki/Locale_(computer_software)#Specifics_for_Microsoft_platforms

const KnownLanguageMappings = Object
  .entries(KnownLanguages)
  .reduce((acc, [, { language, matches }]) => {
    acc.push([language,
      { matches: matches as RegExp | string[] },
    ])
    return acc
  }, [] as Array<[Language, { matches: RegExp | string[] }]>)

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

  const mapping = KnownLanguageMappings.find((mapping) => {
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
