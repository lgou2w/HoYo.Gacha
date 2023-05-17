import React from 'react'
import { AccountFacet } from '@/interfaces/account'
import { NamedGachaRecords } from '@/hooks/useGachaRecordsQuery'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import GachaItemView from '@/components/gacha/GachaItemView'
import { SxProps, Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

export default function GachaAnalysisHistory () {
  const { facet, gachaRecords } = useGachaLayoutContext()
  const { namedValues: { character, weapon, permanent } } = gachaRecords

  return (
    <Box>
      <Typography variant="h6" gutterBottom>❖ 五星历史</Typography>
      <Stack direction="column" spacing={2}>
        <GachaAnalysisHistoryList facet={facet} value={character} />
        <GachaAnalysisHistoryList facet={facet} value={weapon} />
        <GachaAnalysisHistoryList facet={facet} value={permanent} />
      </Stack>
    </Box>
  )
}

function GachaAnalysisHistoryList ({ facet, value }: {
  facet: AccountFacet,
  value: NamedGachaRecords
}) {
  const { category, categoryTitle, metadata: { golden } } = value

  return (
    <Stack className={GachaAnalysisHistoryListCls} sx={GachaAnalysisHistoryListSx}>
      <Box className={`${GachaAnalysisHistoryListCls}-title`}>
        <Typography variant="body1">{categoryTitle}</Typography>
        <Typography variant="body2">
          {category !== 'permanent'
            ? `${golden.sumRestricted} + ${golden.sum - golden.sumRestricted}`
            : golden.sum
          }
        </Typography>
      </Box>
      <Divider orientation="horizontal" variant="fullWidth" />
      <Stack className={`${GachaAnalysisHistoryListCls}-items`}>
        {golden.values.map((item) => (
          <GachaItemView
            facet={facet}
            key={item.id}
            name={item.name}
            id={item.item_id || item.name}
            isWeapon={item.item_type === '武器' || item.item_type === '光锥'}
            rank={5}
            size={GachaAnalysisHistoryItemViewSize}
            usedPity={item.usedPity}
            restricted={item.restricted}
          />
        ))}
      </Stack>
    </Stack>
  )
}

const GachaAnalysisHistoryItemViewSize = 84
const GachaAnalysisHistoryListCls = 'gacha-analysis-history-list'
const GachaAnalysisHistoryListSx: SxProps<Theme> = {
  flexDirection: 'row',
  minHeight: GachaAnalysisHistoryItemViewSize,
  [`& .${GachaAnalysisHistoryListCls}-title`]: {
    width: 100,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    alignItems: 'flex-end'
  },
  '& .MuiDivider-root': {
    width: '2px',
    borderWidth: 1,
    borderColor: 'warning.light',
    marginX: 1.5
  },
  [`& .${GachaAnalysisHistoryListCls}-items`]: {
    gap: 1,
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
}
