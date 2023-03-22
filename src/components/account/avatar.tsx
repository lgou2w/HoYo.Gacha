import React, { useMemo } from 'react'
import MuiAvatar from '@mui/material/Avatar'
import AvatarLumine from '@/assets/images/UI_AvatarIcon_PlayerGirl.png'
import AvatarAether from '@/assets/images/UI_AvatarIcon_PlayerBoy.png'
import { getGenshinAvatarIconUrlById } from '@/interfaces/genshin-icons'

export interface AccountAvatarProps {
  avatarId?: number | null
  width?: string | number
  height?: string | number
}

export default function AccountAvatar (props: AccountAvatarProps) {
  const src = useMemo(() => {
    return props.avatarId
      ? getGenshinAvatarIconUrlById(props.avatarId)
      : AvatarLumine
  }, [props.avatarId])

  return (
    <MuiAvatar src={src} sx={{
      width: props.width,
      height: props.height
    }} />
  )
}
