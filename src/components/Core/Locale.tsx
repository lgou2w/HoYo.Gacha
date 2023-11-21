import React, { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type LocaleOptions = [string, Record<string, unknown>?]
type LocaleTFn = ReturnType<typeof useTranslation>['t']

interface Props<T extends ElementType> {
  component?: T
  mapping: LocaleOptions | ((t: LocaleTFn) => ReactNode)
}

function acceptLocale<T extends ElementType> (
  t: LocaleTFn,
  mapping: Props<T>['mapping']
): ReactNode {
  if (typeof mapping === 'function') {
    return mapping(t)
  } else if (Array.isArray(mapping)) {
    const [key, args] = mapping
    return t(key, args)
  } else {
    return mapping
  }
}

export default function Locale<T extends ElementType> (
  { component: Component, mapping, ...rest }: Props<T> & Omit<ComponentPropsWithoutRef<T>, keyof Props<T>>
) {
  const { t } = useTranslation()
  const children = acceptLocale(t, mapping)
  return Component
    // FIXME:
    //   Type 'Omit<Props<T> & Omit<ComponentPropsWithoutRef<T>, keyof Props<T>>, "mapping" | "component"> & { children: ReactNode; }'
    //   is not assignable to type 'LibraryManagedAttributes<T, any>'.ts(2322)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ? <Component {...rest}>{children}</Component>
    : children
}
