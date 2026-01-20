import { LanguageDetectorAsyncModule } from 'i18next'
import AppCommands from '@/api/commands/app'
import { DefaultLanguage, KnownLanguages, Language, SupportedLanguages } from './locales'

export const LanguageDetectorModuleLocalStorageKey = 'HG_LANGUAGE'
export const LanguageDetectorModule: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  async detect (): Promise<string | readonly string[] | undefined> {
    const dirty = window.localStorage.getItem(LanguageDetectorModuleLocalStorageKey)
    if (dirty && SupportedLanguages.includes(dirty as Language)) {
      console.debug('Use cached user language:', dirty)
      return dirty
    } else if (dirty) {
      console.warn('Invalid cached user language:', dirty)
      window.localStorage.removeItem(LanguageDetectorModuleLocalStorageKey)
    }

    if (!('__TAURI__' in window)) {
      console.warn('Not the Tauri runtime environment.')
      return DefaultLanguage
    }

    let locale: string | null = null
    try {
      locale = (await AppCommands.environment()).locale
    } catch (error) {
      console.error('Failed to get locale:', error)
    }

    return locale
      ? mappingLocale(locale) || DefaultLanguage
      : DefaultLanguage
  },
  cacheUserLanguage (lng: string): void | Promise<void> {
    console.debug('Cache user language:', lng)
    window.localStorage.setItem(LanguageDetectorModuleLocalStorageKey, lng)
  },
}

// https://tauri.app/v1/api/js/os/#locale
// https://github.com/1Password/sys-locale/blob/main/src/windows.rs
// https://learn.microsoft.com/windows/win32/api/winnls/nf-winnls-getuserpreferreduilanguages
// https://en.wikipedia.org/wiki/Locale_(computer_software)#Specifics_for_Microsoft_platforms

const KnownLanguageMappings = Object
  .entries(KnownLanguages)
  .reduce((acc, [, { code, matches }]) => {
    acc.push([code,
      { matches: matches as RegExp | string[] },
    ])
    return acc
  }, [] as [Language, { matches: RegExp | string[] }][])

function mappingLocale (locale: string): Language | undefined {
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
    console.warn(`Unsupported locale: ${locale}`)
    return undefined
  } else {
    const [language] = mapping
    console.debug(`Mapping locale: ${locale} -> ${language}`)
    return language
  }
}
