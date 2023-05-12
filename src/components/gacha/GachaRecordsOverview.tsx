import React from 'react'
import { NamedGachaRecords, useGachaRecordsContext } from '@/hooks/useGachaRecords'
import { SxProps, Theme } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import dayjs from 'dayjs'
import { AccountFacet } from '@/interfaces/account'

// TODO: temp test code

export default function GachaRecordsOverview () {
  return (
    <GachaRecordsOverviewGrid />
  )
}

function GachaRecordsOverviewGrid () {
  const gachaRecords = useGachaRecordsContext()
  if (!gachaRecords) {
    return <Typography>null gachaRecords</Typography>
  }

  const { facet, namedValues: { newbie, permanent, character, weapon } } = gachaRecords

  return (
    <Box>
      <Grid spacing={3} container>
        <Grid xs={6} item>
          <GachaRecordsOverviewCard facet={facet} value={newbie} />
        </Grid>
        <Grid xs={6} item>
          <GachaRecordsOverviewCard facet={facet} value={permanent} />
        </Grid>
        <Grid xs={6} item>
          <GachaRecordsOverviewCard facet={facet} value={character} />
        </Grid>
        <Grid xs={6} item>
          <GachaRecordsOverviewCard facet={facet} value={weapon} />
        </Grid>
      </Grid>
    </Box>
  )
}

function GachaRecordsOverviewCard (props: { facet: AccountFacet, value: NamedGachaRecords }) {
  const { value: { category, gachaType, total, firstTime, lastTime, metadata: { golden } } } = props
  const lastGoldenItem = golden.values[golden.values.length - 1]
  const lastGoldenItemName = lastGoldenItem ? `${lastGoldenItem.name}（${lastGoldenItem.usedPity}）` : '无'
  const currency = props.facet === AccountFacet.Genshin ? '原石' : '星琼'

  return (
    <Stack className={GachaTabOverviewGridCardCls} sx={GachaTabOverviewGridCardSx}>
      <Box className={`${GachaTabOverviewGridCardCls}-category`}>
        <Typography component="div" variant="body2">{gachaType}</Typography>
      </Box>
      <Box>
        <Typography component="div" variant="h4">{category}</Typography>
        <Typography component="div" variant="caption">
          {dayjs(firstTime).format('YYYY.MM.DD')}
          {' - '}
          {dayjs(lastTime).format('YYYY.MM.DD')}
        </Typography>
      </Box>
      <Stack className={`${GachaTabOverviewGridCardCls}-labels`}>
        <Stack>
          <Chip label={`共 ${total} 抽`} color="primary" />
          <Chip label={`已垫 ${golden.nextPity} 抽`} color="secondary" />
          <Chip label={`已出 ${golden.sum} 金`} color="warning" />
        </Stack>
        <Stack>
          <Chip label={`最近出金：${lastGoldenItemName}`} />
          <Chip label={`出金率 ${golden.sumPercentage}%`} />
        </Stack>
        <Stack>
          <Chip label={`平均每金 ${golden.sumAverage} 抽`} />
          <Chip label={`平均每金 ${golden.sumAverage * 160} ${currency}`} />
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
