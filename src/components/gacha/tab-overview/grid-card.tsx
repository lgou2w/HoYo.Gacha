import React from 'react'
import { SxProps, Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import { NamedGachaLogs } from '@/hooks/useGachaLogsQuery'
import dayjs from '@/utilities/dayjs'

export interface GachaTabOverviewGridCardProps {
  value: NamedGachaLogs
}

export default function GachaTabOverviewGridCard (props: GachaTabOverviewGridCardProps) {
  const { value: { category, categoryTitle, total, firstTime, lastTime, metadata: { golden } } } = props
  const lastGoldenItem = golden.values[golden.values.length - 1]
  const lastGoldenItemName = lastGoldenItem ? `${lastGoldenItem.name}（${lastGoldenItem.usedPity}）` : '无'

  return (
    <Stack className={GachaTabOverviewGridCardCls} sx={GachaTabOverviewGridCardSx}>
      <Box className={`${GachaTabOverviewGridCardCls}-category`} data-aggregated={category === 'aggregated'}>
        <Typography component="div" variant="body2">{categoryTitle}</Typography>
      </Box>
      <Box>
        <Typography component="div" variant="h4">{categoryTitle}</Typography>
        <Typography component="div" variant="caption">
          {dayjs(firstTime).format('YYYY.MM.DD')}
          {' - '}
          {dayjs(lastTime).format('YYYY.MM.DD')}
        </Typography>
      </Box>
      <Stack className={`${GachaTabOverviewGridCardCls}-labels`}>
        <Stack>
          <Chip label={`共 ${total} 抽`} color="primary" />
          {category !== 'aggregated' && <Chip label={`已垫 ${golden.nextPity} 抽`} color="secondary" />}
          <Chip label={`已出 ${golden.sum} 金`} color="warning" />
        </Stack>
        <Stack>
          <Chip label={`最近出金：${lastGoldenItemName}`} />
          <Chip label={`出金率 ${golden.sumPercentage}%`} />
        </Stack>
        <Stack>
          <Chip label={`平均每金 ${golden.sumAverage} 抽`} />
          <Chip label={`平均每金 ${golden.sumAverage * 160} 原石`} />
        </Stack>
      </Stack>
    </Stack>
  )
}

const GachaTabOverviewGridCardCls = 'gacha-tab-overview-grid-card'
const GachaTabOverviewGridCardSx: SxProps<Theme> = {
  gap: 2,
  position: 'relative',
  height: '100%',
  padding: 2,
  border: 2,
  borderRadius: 2,
  borderColor: 'grey.300',
  bgcolor: 'grey.100',
  userSelect: 'none',
  [`& .${GachaTabOverviewGridCardCls}-category`]: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingX: 2,
    paddingY: 0.5,
    color: 'white',
    borderLeft: 2,
    borderBottom: 2,
    borderColor: 'inherit',
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 6,
    bgcolor: 'success.light',
    '&[data-aggregated="true"]': { bgcolor: 'warning.light' }
  },
  [`& .${GachaTabOverviewGridCardCls}-labels`]: {
    gap: 1,
    fontSize: '1rem',
    '& > .MuiStack-root': { flexDirection: 'row', gap: 1 },
    '& > .MuiStack-root > .MuiChip-root': { fontSize: 'inherit' }
  }
}
