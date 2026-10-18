import { describe, expect, it } from 'vitest'
import { languageMetadata } from '@/i18n/hooks'

describe('languageMetadata', () => {
  it('resolves en-US', () => {
    const m = languageMetadata('en-US')
    expect(m.language).toBe('en-US')
    expect(m.constants.text).toBe('English (US)')
    expect(m.constants.gacha).toBe('en-us')
    expect(m.constants.dayjs).toBe('en')
  })

  it('resolves zh-Hans', () => {
    const m = languageMetadata('zh-Hans')
    expect(m.language).toBe('zh-Hans')
    expect(m.constants.text).toBe('简体中文')
    expect(m.constants.gacha).toBe('zh-cn')
  })

  it('resolves zh-Hant', () => {
    const m = languageMetadata('zh-Hant')
    expect(m.language).toBe('zh-Hant')
    expect(m.constants.text).toBe('繁體中文')
  })

  it('throws for unsupported languages', () => {
    expect(() => languageMetadata('xx-YY')).toThrow(/Unsupported language/)
    expect(() => languageMetadata('')).toThrow(/Unsupported language/)
  })

  it('the returned dayjs factory applies the language locale', () => {
    expect(languageMetadata('en-US').dayjs('2024-01-01').locale()).toBe('en')
    expect(languageMetadata('zh-Hans').dayjs('2024-01-01').locale()).toBe('zh-cn')
  })
})
