import React from 'react'
import { Image, ImageProps } from '@fluentui/react-components'
import { AccountBusiness, AccountBusinesses } from '@/api/interfaces/account'
import GenshinImpactAvatarTravelerBoy from '@/assets/images/GenshinImpact/Avatar/Traveler_Boy.png'
import GenshinImpactAvatarTravelerGirl from '@/assets/images/GenshinImpact/Avatar/Traveler_Girl.png'
import HonkaiStarRailAvatarTravelerBoy1 from '@/assets/images/HonkaiStarRail/Avatar/Trailblazer_Boy_1.png'
import HonkaiStarRailAvatarTravelerBoy2 from '@/assets/images/HonkaiStarRail/Avatar/Trailblazer_Boy_2.png'
import HonkaiStarRailAvatarTravelerGirl1 from '@/assets/images/HonkaiStarRail/Avatar/Trailblazer_Girl_1.png'
import HonkaiStarRailAvatarTravelerGirl2 from '@/assets/images/HonkaiStarRail/Avatar/Trailblazer_Girl_2.png'

// TODO: Support custom player avatar

type Avatar = { boy: string, girl: string }

const EmbeddedAvatars: Record<AccountBusiness, Avatar[]> = {
  [AccountBusinesses.GenshinImpact]: [
    {
      boy: GenshinImpactAvatarTravelerBoy,
      girl: GenshinImpactAvatarTravelerGirl
    }
  ],
  [AccountBusinesses.HonkaiStarRail]: [
    {
      boy: HonkaiStarRailAvatarTravelerBoy1,
      girl: HonkaiStarRailAvatarTravelerGirl1
    },
    {
      boy: HonkaiStarRailAvatarTravelerBoy2,
      girl: HonkaiStarRailAvatarTravelerGirl2
    }
  ]
}

interface Props extends Omit<ImageProps, 'alt' | 'src'> {
  business: AccountBusiness
  type: [number, keyof Avatar]
}

export default function PlayerAvatar (props: Props) {
  const { business, type: [set, gender], ...rest } = props
  const src = EmbeddedAvatars[business][set]?.[gender]
  return (
    <Image alt="Avatar" src={src} {...rest} />
  )
}
