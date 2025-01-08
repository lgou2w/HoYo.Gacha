import { ElementType, ReactNode } from 'react'
import type { useTranslation } from 'react-i18next'

export type LocaleTFn = ReturnType<typeof useTranslation>['t']

export interface LocaleProps<T extends ElementType = ElementType> {
  component?: T
  mapping:
    | ReactNode
    | Parameters<LocaleTFn>
    | ((t: LocaleTFn) => ReactNode)
}

export function acceptLocale<T extends ElementType = ElementType> (
  t: LocaleTFn,
  mapping: LocaleProps<T>['mapping'],
): ReactNode {
  if (typeof mapping === 'function') {
    return mapping(t)
  } else if (Array.isArray(mapping)) {
    return t(...mapping)
  } else {
    return mapping
  }
}
