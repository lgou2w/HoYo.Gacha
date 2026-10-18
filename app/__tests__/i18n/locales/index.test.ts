import { describe, expect, it } from 'vitest'
import { DefaultLanguage, KnownLanguages, SupportedLanguages, isChinese } from '@/i18n/locales'

describe('KnownLanguages', () => {
  it('contains exactly the supported codes', () => {
    expect(Object.keys(KnownLanguages)).toEqual(['en-US', 'zh-Hans', 'zh-Hant'])
  })

  it('every entry carries the required constants', () => {
    for (const [code, meta] of Object.entries(KnownLanguages)) {
      expect(meta.code).toBe(code)
      expect(meta.constants.text).toBeTruthy()
      expect(meta.constants.dayjs).toBeTruthy()
      expect(meta.constants.gacha).toBeTruthy()
    }
  })
})

describe('SupportedLanguages', () => {
  it('matches the keys of KnownLanguages', () => {
    expect(SupportedLanguages).toEqual(Object.keys(KnownLanguages))
  })
})

describe('DefaultLanguage', () => {
  it('is the first supported language', () => {
    expect(DefaultLanguage).toBe(SupportedLanguages[0])
    expect(DefaultLanguage).toBe('en-US')
  })
})

describe('isChinese', () => {
  it('true for zh-Hans and zh-Hant', () => {
    expect(isChinese('zh-Hans')).toBe(true)
    expect(isChinese('zh-Hant')).toBe(true)
  })

  it('false otherwise', () => {
    expect(isChinese('en-US')).toBe(false)
    expect(isChinese('ja-JP')).toBe(false)
    expect(isChinese('')).toBe(false)
  })
})
