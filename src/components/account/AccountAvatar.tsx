import React from 'react'
import Avatar, { AvatarProps } from '@mui/material/Avatar'
import { AccountFacet } from '@/interfaces/account'
import AvatarGenshinLumine from '@/assets/images/genshin/UI_AvatarIcon_PlayerGirl.png'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import AvatarGenshinAether from '@/assets/images/genshin/UI_AvatarIcon_PlayerBoy.png'
import AvatarStarRailTrailblazer from '@/assets/images/starrail/Trailblazer.png'

export interface AccountAvatarProps extends Omit<AvatarProps, 'src'> {
  facet: AccountFacet
}

export default function AccountAvatar (props: AccountAvatarProps) {
  const { facet, ...rest } = props
  const src = React.useMemo(() => {
    switch (facet) {
      case AccountFacet.Genshin:
        return AvatarGenshinLumine
      case AccountFacet.StarRail:
        return AvatarStarRailTrailblazer
      default:
        return undefined
    }
  }, [facet])

  return (
    <Avatar src={src} {...rest} />
  )
}
