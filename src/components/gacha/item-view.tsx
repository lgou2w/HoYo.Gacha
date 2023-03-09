import React, { useMemo } from 'react'
import { SxProps, Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { getGenshinIconUrl } from '@/interfaces/genshin-icons'
import UIRarity3Background from '@/assets/images/UI_Rarity_3_Background.png'
import UIRarity4Background from '@/assets/images/UI_Rarity_4_Background.png'
import UIRarity5Background from '@/assets/images/UI_Rarity_5_Background.png'

export interface GachaItemViewProps {
  name: string
  isEquip: boolean
  rank: 3 | 4 | 5 | '3' | '4' | '5'
  size: number
  usedPity?: number
  restricted?: boolean
}

export default function GachaItemView (props: GachaItemViewProps) {
  const { name, isEquip, rank, size, usedPity, restricted } = props
  const src = useMemo(() => getGenshinIconUrl(name, isEquip), [name, isEquip])

  return (
    <Box className={GachaItemViewCls} sx={GachaItemViewSx} width={size} data-rank={rank} data-restricted={restricted}>
      <img src={src} alt={name} title={name} />
      {usedPity && <Typography className={`${GachaItemViewCls}-used-pity`}>{usedPity}</Typography>}
      {restricted && <Typography className={`${GachaItemViewCls}-restricted`}>限定</Typography>}
    </Box>
  )
}

const GachaItemViewCls = 'gacha-item-view'
const GachaItemViewSx: SxProps<Theme> = {
  position: 'relative',
  display: 'flex',
  alignSelf: 'flex-start',
  flexDirection: 'column',
  borderRadius: 2,
  '& > img': {
    width: '100%',
    height: '100%',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    borderRadius: 2
  },
  '&[data-rank="3"] > img': { backgroundImage: `url(${UIRarity3Background})` },
  '&[data-rank="4"] > img': { backgroundImage: `url(${UIRarity4Background})` },
  '&[data-rank="5"] > img': { backgroundImage: `url(${UIRarity5Background})` },
  '& > .MuiTypography-root': {
    textAlign: 'center',
    lineHeight: '1rem',
    fontSize: '0.75rem',
    userSelect: 'none',
    position: 'absolute',
    paddingX: 0.2,
    color: 'white',
    borderColor: 'white',
    minWidth: '1.25rem'
  },
  [`& .${GachaItemViewCls}-used-pity`]: {
    right: 0,
    bottom: 0,
    bgcolor: 'rgb(210, 120, 120)',
    borderLeft: 2,
    borderTop: 2,
    borderTopLeftRadius: 4,
    borderBottomRightRadius: 4
  },
  [`& .${GachaItemViewCls}-restricted`]: {
    top: 0,
    left: 0,
    bgcolor: 'rgb(140, 185, 75)',
    borderRight: 2,
    borderBottom: 2,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 4
  }
}
