import React, { useMemo } from 'react'
import { Image, ImageProps } from '@fluentui/react-components'
import {
  Business,
  Businesses,
  ReversedBusinesses,
  GenshinImpact,
  HonkaiStarRail,
  ZenlessZoneZero
} from '@/api/interfaces/account'

// TODO: Support custom player avatar

interface Props<T extends Business> extends Omit<ImageProps, 'alt' | 'src'> {
  business: T
  gender: 'Boy' | 'Girl'
  set:
      T extends GenshinImpact ? 1
    : T extends HonkaiStarRail ? 1 | 2 | 3
    : T extends ZenlessZoneZero ? 1
    : never
}

const BusinessPlayerMappings: Record<Business, string> = {
  [Businesses.GenshinImpact]: 'Traveler',
  [Businesses.HonkaiStarRail]: 'Trailblazer',
  [Businesses.ZenlessZoneZero]: 'Proxy'
}

export default function PlayerAvatar<T extends Business> (props: Props<T>) {
  const { business, gender, set, ...rest } = props
  const src = useMemo(
    () => `/${ReversedBusinesses[business]}/Avatar/${BusinessPlayerMappings[business]}_${gender}_${set}.png`,
    [business, gender, set]
  )

  return (
    <Image alt="Avatar" src={src} {...rest} />
  )
}
