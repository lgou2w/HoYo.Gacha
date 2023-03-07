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
  contentText: React.ReactNode
  isEquip: boolean
  rank: 3 | 4 | 5 | '3' | '4' | '5'
  size: number
}

export default function GachaItemView (props: GachaItemViewProps) {
  const { name, isEquip, contentText, rank, size } = props
  const src = useMemo(() => getGenshinIconUrl(name, isEquip), [name, isEquip])

  return (
    <Box className={GachaItemViewCls} sx={GachaItemViewSx} data-rank={rank}>
      <img src={src} alt={name} title={name} width={size} />
      <Typography>{contentText}</Typography>
    </Box>
  )
}

const GachaItemViewCls = 'gacha-item-view'
const GachaItemViewSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  border: 1,
  borderColor: 'grey.300',
  borderRadius: 1,
  '&[data-rank="3"]': { backgroundImage: `url(${UIRarity3Background})` },
  '&[data-rank="4"]': { backgroundImage: `url(${UIRarity4Background})` },
  '&[data-rank="5"]': { backgroundImage: `url(${UIRarity5Background})` },
  '& > img': { height: 'auto' },
  '& > .MuiTypography-root': {
    fontSize: '0.75rem',
    textAlign: 'center',
    lineHeight: '1rem'
  }
}
