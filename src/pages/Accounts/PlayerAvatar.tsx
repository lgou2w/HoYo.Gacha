import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ImageProps } from '@fluentui/react-components'
import { Business, ReversedBusinesses } from '@/api/interfaces/account'

// TODO: Support custom player avatar

interface Props<T extends Business> extends Omit<ImageProps, 'alt' | 'src'> {
  business: T
  gender: 'Boy' | 'Girl'
  set:
      T extends 0 ? 1
    : T extends 1 ? 1 | 2 | 3
    : never
}

export default function PlayerAvatar<T extends Business> (props: Props<T>) {
  const { business, gender, set, ...rest } = props

  const { t } = useTranslation()
  const src = useMemo(() => {
    const keyOfBusinesses = ReversedBusinesses[business]
    const player = t(`Business.${keyOfBusinesses}.Player`)
    return `/${keyOfBusinesses}/Avatar/${player}_${gender}_${set}.png`
  }, [business, gender, set, t])

  return (
    <Image alt="Avatar" src={src} {...rest} />
  )
}
