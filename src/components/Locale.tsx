import React, { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import useI18n from '@/hooks/useI18n'

export type UseI18nResponse = ReturnType<typeof useI18n>

export type LocaleMapping =
  | ReactNode
  | Parameters<UseI18nResponse['t']>
  | ((i18n: UseI18nResponse) => ReactNode)

export interface LocaleProps<T extends ElementType = ElementType> {
  component?: T
  mapping: LocaleMapping
  childrenPosition?: 'before' | 'after'
}

function resolveMapping (
  i18n: UseI18nResponse,
  mapping: LocaleMapping,
): ReactNode {
  if (typeof mapping === 'function') {
    return mapping(i18n)
  } else if (Array.isArray(mapping)) {
    return i18n.t(...mapping)
  } else {
    return mapping
  }
}

export default function Locale<T extends ElementType> (
  { component: Component, mapping, children: child, childrenPosition = 'after', ...rest }: LocaleProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof LocaleProps<T>>,
) {
  const i18n = useI18n()
  const content = resolveMapping(i18n, mapping)
  const children = childrenPosition === 'after' ? [content, child] : [child, content]
  return Component
    // FIXME:
    //   Type 'Omit<Props<T> & Omit<ComponentPropsWithoutRef<T>, keyof Props<T>>, "mapping" | "component"> & { children: ReactNode; }'
    //   is not assignable to type 'LibraryManagedAttributes<T, any>'.ts(2322)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ? <Component {...rest}>{children}</Component>
    : children
}
