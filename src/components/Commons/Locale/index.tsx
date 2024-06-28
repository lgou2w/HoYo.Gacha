import React, { ComponentPropsWithoutRef, ElementType } from 'react'
import { useTranslation } from 'react-i18next'
import { LocaleProps, acceptLocale } from './declares'

export default function Locale<T extends ElementType> (
  { component: Component, mapping, ...rest }: LocaleProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof LocaleProps<T>>
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
