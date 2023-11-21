import React from 'react'
import { Image, ImageProps } from '@fluentui/react-components'
import { AccountFacet, AccountFacets } from '@/api/interfaces/account'
import GenshinAvatarTravelerBoy from '@/assets/images/Genshin/Avatar/Traveler_Boy.png'
import GenshinAvatarTravelerGirl from '@/assets/images/Genshin/Avatar/Traveler_Girl.png'
import StarRailAvatarTravelerBoy1 from '@/assets/images/StarRail/Avatar/Trailblazer_Boy_1.png'
import StarRailAvatarTravelerBoy2 from '@/assets/images/StarRail/Avatar/Trailblazer_Boy_2.png'
import StarRailAvatarTravelerGirl1 from '@/assets/images/StarRail/Avatar/Trailblazer_Girl_1.png'
import StarRailAvatarTravelerGirl2 from '@/assets/images/StarRail/Avatar/Trailblazer_Girl_2.png'

// TODO: Support custom player avatar

type Avatar = { boy: string, girl: string }

const EmbeddedAvatars: Record<AccountFacet, Avatar[]> = {
  [AccountFacets.Genshin]: [
    {
      boy: GenshinAvatarTravelerBoy,
      girl: GenshinAvatarTravelerGirl
    }
  ],
  [AccountFacets.StarRail]: [
    {
      boy: StarRailAvatarTravelerBoy1,
      girl: StarRailAvatarTravelerGirl1
    },
    {
      boy: StarRailAvatarTravelerBoy2,
      girl: StarRailAvatarTravelerGirl2
    }
  ]
}

interface Props extends Omit<ImageProps, 'alt' | 'src'> {
  facet: AccountFacet
  type: [number, keyof Avatar]
}

export default function PlayerAvatar (props: Props) {
  const { facet, type: [set, gender], ...rest } = props
  const src = EmbeddedAvatars[facet][set]?.[gender]
  return (
    <Image alt="Avatar" src={src} {...rest} />
  )
}
