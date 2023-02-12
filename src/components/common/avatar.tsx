import React from 'react'
import MuiAvatar from '@mui/material/Avatar'
import AvatarLumine from '@/assets/images/UI_AvatarIcon_PlayerGirl.png'
import AvatarAether from '@/assets/images/UI_AvatarIcon_PlayerBoy.png'

type AvatarVariant = 'lumine' | 'aether'

interface Props {
  variant?: AvatarVariant
  width?: string | number
  height?: string | number
}

const DEFAULT_VARIANT: AvatarVariant = 'lumine'
const Avatars: Record<AvatarVariant, string> = {
  lumine: AvatarLumine,
  aether: AvatarAether
}

export default function Avatar (props: Props) {
  return (
    <MuiAvatar
      src={Avatars[props.variant || DEFAULT_VARIANT]}
      sx={{ width: props.width, height: props.height }}
    />
  )
}
