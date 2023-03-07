import React from 'react'
import { SxProps, Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import GachaItemView from '@/components/gacha/item-view'
import { GroupedGachaLogs, NamedGachaLogs } from '@/hooks/useGachaLogsQuery'
import dayjs from '@/utilities/dayjs'

export interface GachaTabOverviewGridCardProps {
  category: keyof GroupedGachaLogs['namedValues']
  value: NamedGachaLogs
}

export default function GachaTabOverviewGridCard (props: GachaTabOverviewGridCardProps) {
  const { category, value: { total, firstTime, lastTime, metadata: { golden } } } = props
  const lastGoldenItem = golden.values[golden.values.length - 1]

  return (
    <Stack className={GachaTabOverviewGridCardCls} sx={GachaTabOverviewGridCardSx}>
      <Box className={`${GachaTabOverviewGridCardCls}-category`} data-aggregated={category === 'aggregated'}>
        <Typography component="div" variant="body2">
          {CategoryTitles[category]}
        </Typography>
      </Box>
      <Box>
        <Typography component="div" variant="h4">
          {CategoryTitles[category]}
        </Typography>
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
          <Chip label={`最近出金：${lastGoldenItem ? `${lastGoldenItem.name}（${lastGoldenItem.usedPity}）` : '无'}`} />
          <Chip label={`出金率 ${golden.sumPercentage}%`} />
        </Stack>
        <Stack>
          <Chip label={`平均每金 ${golden.sumAverage} 抽`} />
          <Chip label={`平均每金 ${golden.sumAverage * 160} 原石`} />
        </Stack>
      </Stack>
      <Stack className={`${GachaTabOverviewGridCardCls}-items`}>
        {golden.values.map((item) => (
          <GachaItemView
            key={item.id}
            name={item.name}
            contentText={item.usedPity}
            isEquip={item.itemType === '武器'}
            rank={5} size={74}
          />
        ))}
      </Stack>
    </Stack>
  )
}

const CategoryTitles: Record<GachaTabOverviewGridCardProps['category'], string> = {
  newbie: '新手祈愿',
  character: '角色活动祈愿',
  weapon: '武器活动祈愿',
  permanent: '常驻祈愿',
  aggregated: '合计'
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
  },
  [`& .${GachaTabOverviewGridCardCls}-items`]: {
    gap: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    '&::after': {
      content: '""',
      flex: 'auto'
    }
  }
}
