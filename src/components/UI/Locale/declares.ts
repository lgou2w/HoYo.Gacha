import { ElementType } from 'react'
import { useTranslation } from 'react-i18next'

export type LocaleOptions = [string, Record<string, unknown>?]
export type LocaleTFn = ReturnType<typeof useTranslation>['t']

export interface LocaleProps<T extends ElementType = ElementType> {
  component?: T
  mapping: LocaleOptions | ((t: LocaleTFn) => string)
}

export function acceptLocale<T extends ElementType = ElementType> (
  t: LocaleTFn,
  mapping: LocaleProps<T>['mapping']
): string {
  if (typeof mapping === 'function') {
    return mapping(t)
  } else if (Array.isArray(mapping)) {
    return t(...mapping)
  } else {
    return mapping
  }
}
