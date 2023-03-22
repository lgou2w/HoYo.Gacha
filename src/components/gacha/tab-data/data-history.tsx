import React from 'react'
import { SxProps, Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import GachaItemView from '@/components/gacha/item-view'
import { GroupedGachaLogs, NamedGachaLogs } from '@/hooks/useGachaLogsQuery'

export interface GachaTabDataHistoryProps {
  values: GroupedGachaLogs['namedValues']
}

export default function GachaTabDataHistory (props: GachaTabDataHistoryProps) {
  const { values: { character, weapon, permanent } } = props
  return (
    <Box className={GachaTabDataHistoryCls} sx={GachaTabDataHistorySx}>
      <Typography variant="h6" gutterBottom>❖ 五星历史</Typography>
      <Stack flexDirection="column" gap={2}>
        <GachaTabDataHistoryList data={character} />
        <GachaTabDataHistoryList data={weapon} />
        <GachaTabDataHistoryList data={permanent} />
      </Stack>
    </Box>
  )
}

function GachaTabDataHistoryList (props: { data: NamedGachaLogs }) {
  const { category, categoryTitle, metadata: { golden } } = props.data
  return (
    <Stack className={`${GachaTabDataHistoryCls}-list`}>
      <Box className={`${GachaTabDataHistoryCls}-list-title`}>
        <Typography variant="body1">{categoryTitle}</Typography>
        <Typography variant="body2">
          {category !== 'permanent'
            ? `${golden.sumRestricted} + ${golden.sum - golden.sumRestricted}`
            : golden.sum
          }
        </Typography>
      </Box>
      <Divider orientation="horizontal" variant="fullWidth" />
      <Stack className={`${GachaTabDataHistoryCls}-list-items`}>
        {golden.values.map((item) => (
          <GachaItemView
            key={item.id}
            name={item.name}
            isEquip={item.itemType === '武器'}
            rank={5}
            size={GachaTabDataHistoryItemViewSize}
            usedPity={item.usedPity}
            restricted={item.restricted}
          />
        ))}
      </Stack>
    </Stack>
  )
}

const GachaTabDataHistoryItemViewSize = 84
const GachaTabDataHistoryCls = 'gacha-tab-data-history'
const GachaTabDataHistorySx: SxProps<Theme> = {
  [`& .${GachaTabDataHistoryCls}-list`]: {
    flexDirection: 'row',
    minHeight: GachaTabDataHistoryItemViewSize
  },
  [`& .${GachaTabDataHistoryCls}-list-title`]: {
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
  [`& .${GachaTabDataHistoryCls}-list-items`]: {
    gap: 1,
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
}
