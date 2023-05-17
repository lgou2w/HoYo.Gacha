import React from 'react'
import { AccountFacet, resolveCurrency } from '@/interfaces/account'
import { GachaRecords, NamedGachaRecords } from '@/hooks/useGachaRecordsQuery'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import { SxProps, Theme } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import dayjs from 'dayjs'

export default function GachaOverviewGrid () {
  const { facet, gachaRecords } = useGachaLayoutContext()
  const { namedValues: { character, weapon, permanent, newbie }, aggregatedValues } = gachaRecords

  return (
    <Box>
      <Grid spacing={2} container>
        <Grid xs={6} item>
          <GachaOverviewGridCard facet={facet} value={character} />
        </Grid>
        <Grid xs={6} item>
          <GachaOverviewGridCard facet={facet} value={weapon} />
        </Grid>
        <Grid xs={6} item>
          <GachaOverviewGridCard facet={facet} value={permanent} />
        </Grid>
        <Grid xs={6} item>
          <GachaOverviewGridCard facet={facet} value={aggregatedValues} newbie={newbie} />
        </Grid>
      </Grid>
    </Box>
  )
}

const KnownCategoryTitles: Record<AccountFacet, Record<NamedGachaRecords['category'] | 'aggregated', string>> = {
  [AccountFacet.Genshin]: {
    character: '角色活动',
    weapon: '武器活动',
    permanent: '常驻',
    newbie: '新手',
    aggregated: '合计'
  },
  [AccountFacet.StarRail]: {
    character: '角色活动',
    weapon: '光锥活动',
    permanent: '常驻',
    newbie: '新手',
    aggregated: '合计'
  }
}

function GachaOverviewGridCard ({ facet, value, newbie }: {
  facet: AccountFacet
  value: NamedGachaRecords | GachaRecords['aggregatedValues']
  newbie?: NamedGachaRecords
}) {
  const { total, firstTime, lastTime, metadata: { golden } } = value
  const { currency, action } = resolveCurrency(facet)

  const category = 'category' in value ? value.category : 'aggregated'
  let categoryTitle = KnownCategoryTitles[facet][category]
  if (category !== 'aggregated') {
    categoryTitle += action
  }

  const lastGolden = golden.values[golden.values.length - 1]
  const lastGoldenName = lastGolden ? `${lastGolden.name}（${lastGolden.usedPity}）` : '无'

  const newbieGolden = newbie && newbie.metadata.golden.values[0]
  const newbieGoldenName = newbieGolden && `${newbieGolden.name}`

  return (
    <Stack sx={GachaOverviewGridCardSx}>
      <Box className="category">
        <Typography component="div" variant="body2">{categoryTitle}</Typography>
      </Box>
      <Box>
        <Typography component="div" variant="h4">
          {categoryTitle}
          {category === 'aggregated' && <Typography variant="button">（包含新手）</Typography>}
        </Typography>
        <Typography component="div" variant="caption">
          {dayjs(firstTime).format('YYYY.MM.DD')}
          {' - '}
          {dayjs(lastTime).format('YYYY.MM.DD')}
        </Typography>
      </Box>
      <Stack className="labels">
        <Stack>
          <Chip label={`共 ${total} 抽`} color="primary" />
          {category !== 'aggregated'
            ? <Chip label={`已垫 ${golden.nextPity} 抽`} color="secondary" />
            : newbieGoldenName && <Chip label={`新手：${newbieGoldenName}`} color="warning" />
          }
          <Chip label={`已出 ${golden.sum} 金`} color="warning" />
        </Stack>
        <Stack>
          <Chip label={`最近出金：${lastGoldenName}`} />
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

const GachaOverviewGridCardSx: SxProps<Theme> = {
  gap: 2,
  position: 'relative',
  height: '100%',
  padding: 2,
  border: 1.5,
  borderRadius: 2,
  borderColor: 'grey.300',
  bgcolor: 'grey.100',
  userSelect: 'none',
  '& .category': {
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
  '& .labels': {
    gap: 1,
    fontSize: '1rem',
    '& > .MuiStack-root': { flexDirection: 'row', gap: 1 },
    '& > .MuiStack-root > .MuiChip-root': { fontSize: 'inherit' }
  }
}