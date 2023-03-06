import React, { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import { GachaLogItem } from '@/interfaces/models'
import { getGenshinIconUrl } from '@/interfaces/genshin-icons'
import dayjs from '@/utilities/dayjs'
import UIRarity5Background from '@/assets/images/UI_Rarity_5_Background.png'

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

interface Props {
  total: number
  data: Record<GachaLogItem['gachaType'], GachaLogItem[]>
  firstTime?: string
  lastTime?: string
}

export default function GachaTabOverview (props: Props) {
  const { total, groups, firstTime, lastTime } = useMemo(() => {
    const gachaTypeGroups = props.data
    const character = [
      ...(gachaTypeGroups['301'] || []),
      ...(gachaTypeGroups['400'] || [])]
      .sort((a, b) => a.id.localeCompare(b.id))

    return {
      groups: {
        character,
        weapon: gachaTypeGroups['302'] || [],
        permanent: gachaTypeGroups['200'] || []
      },
      total: props.total,
      firstTime: dayjs(props.firstTime, TIME_FORMAT).format('lll'),
      lastTime: dayjs(props.lastTime, TIME_FORMAT).format('lll')
    }
  }, [props])

  return (
    <Stack spacing={3}>
      <Grid spacing={3} container>
        <Grid xs={6} item>
          <GachaTabOverviewCard category="角色活动祈愿" data={groups.character} />
        </Grid>
        <Grid xs={6} item>
          <GachaTabOverviewCard category="武器活动祈愿" data={groups.weapon} />
        </Grid>
        <Grid xs={6} item>
          <GachaTabOverviewCard category="常驻祈愿" data={groups.permanent} />
        </Grid>
        <Grid xs={6} item>
          <GachaTabOverviewCard category="祈愿记录" data={groups} />
        </Grid>
      </Grid>
      <Box>
        <Typography>
          {'· 共计祈愿 '}
          <Typography component="span" color="primary">
            {total}
          </Typography>
          {' 次，总价值 '}
          <Typography component="span" color="warning.light">
            {total * 160}
          </Typography>
          {' 原石。'}
          {'折合现金大约'}
          <Typography component="span" color="error">
            ￥{Math.floor(total * 160 / 8080) * 648}
          </Typography>
          {' 元。'}
        </Typography>
        <Typography>
          {'· 祈愿记录日期覆盖范围：'}
          <Typography component="span" color="secondary">{firstTime}</Typography>
          {' ~ '}
          <Typography component="span" color="secondary">{lastTime}</Typography>
          {'。'}
        </Typography>
        <Typography>
          · 因官方设定，最新数据存在约一小时的延迟。如遇到新池高峰期延迟可能更久。具体时间请以游戏内数据为准。
        </Typography>
      </Box>
    </Stack>
  )
}

interface GachaTabOverviewCardProps {
  category: string
  data: GachaLogItem[] | { character: GachaLogItem[]; weapon: GachaLogItem[], permanent: GachaLogItem[] }
}

type GoldMetadata = { id: string, name: string, pity: number, iconUrl?: string }

function GachaTabOverviewCard (props: GachaTabOverviewCardProps) {
  const aggregated = !Array.isArray(props.data) && typeof props.data === 'object'
  const { total, goldPity, goldSum, goldPercent, goldAverage, goldItem, golds, firstTime, lastTime } = useMemo(() => {
    let golds: GoldMetadata[] = []
    let goldPity = 0
    let goldPitySum = 0
    let goldSum = 0
    let total = 0
    let firstTime: string | undefined
    let lastTime: string | undefined

    if (Array.isArray(props.data)) {
      total = props.data.length
      const result = computeGachaGolds(props.data)
      golds = result.golds
      goldPitySum = result.golds.reduce((pv, cv) => pv + cv.pity, 0)
      goldPity = result.pity
      goldSum = result.sum
      firstTime = props.data[0]?.time
      lastTime = props.data[props.data.length - 1]?.time
    } else {
      total = props.data.character.length + props.data.weapon.length + props.data.permanent.length
      const characterResult = computeGachaGolds(props.data.character)
      const weaponResult = computeGachaGolds(props.data.weapon)
      const permanentResult = computeGachaGolds(props.data.permanent)
      const allGolds = [...characterResult.golds, ...weaponResult.golds, ...permanentResult.golds]
      goldPitySum = allGolds.reduce((pv, cv) => pv + cv.pity, 0)
      goldSum = characterResult.sum + weaponResult.sum + permanentResult.sum
      golds = allGolds.sort((a, b) => a.id.localeCompare(b.id))
    }

    return {
      total,
      goldPity,
      goldSum,
      goldPercent: goldSum > 0 ? Math.round((goldSum / total) * 10000) / 100 : 0,
      goldAverage: goldSum > 0 ? Math.ceil(Math.round((goldPitySum / goldSum) * 100) / 100) : 0,
      goldItem: golds[golds.length - 1] as GoldMetadata | undefined,
      golds,
      firstTime,
      lastTime
    }
  }, [props.data])

  const [open, setOpen] = useState(false)
  const handleOpenClick = () => {
    if (goldSum > 0) {
      setOpen(!open)
    }
  }

  return (
    <Box position="relative" height="100%" padding={2} paddingBottom={1} border={2} borderRadius={2} borderColor="grey.300" bgcolor="grey.100">
      <Box position="absolute" top={0} right={0} bgcolor={aggregated ? 'warning.light' : 'success.light'}
        borderLeft={2} borderBottom={2} borderColor="grey.300" sx={{
          borderBottomLeftRadius: 12,
          borderTopRightRadius: 6
        }}
      >
        <Typography component="div" paddingY={0.5} paddingX={2} variant="body2" color="white">
          {props.category}
        </Typography>
      </Box>
      <Box display="flex" flexDirection="column">
        <Typography component="div" variant="h4">{props.category}</Typography>
        <Typography component="div" variant="caption" color="grey.600" marginLeft={1} marginTop={1} visibility={aggregated ? 'hidden' : 'visible'}>
          {dayjs(firstTime, TIME_FORMAT).format('YYYY.MM.DD')}
          {' - '}
          {dayjs(lastTime, TIME_FORMAT).format('YYYY.MM.DD')}
        </Typography>
      </Box>
      <Box sx={{
        marginTop: 2,
        marginBottom: -1,
        '& .MuiChip-root': {
          marginRight: 1,
          marginBottom: 1,
          fontSize: '1rem'
        }
      }}>
        <Box>
          <Chip label={`共 ${total} 抽`} color="primary" />
          {!aggregated && <Chip label={`已垫 ${goldPity} 抽`} color="secondary" />}
          <Chip label={`已出 ${goldSum} 金`} color="warning" />
        </Box>
        <Box>
          <Chip label={`最近出金：${goldItem ? `${goldItem.name}（${goldItem.pity}）` : '无'}`} />
          <Chip label={`出金率 ${goldPercent}%`} />
        </Box>
        <Box>
          <Chip label={`平均每金 ${goldAverage} 抽`} />
          <Chip label={`平均每金 ${goldAverage * 160} 原石`} />
        </Box>
      </Box>
      <Box marginTop={2} fontSize="0.875rem">
        <Button variant="text" size="small" onClick={handleOpenClick}>
          {!aggregated ? '查看历史记录' : '查看合计记录'}
        </Button>
        <Collapse in={open}>
          <Box marginY={1} display="flex" flexWrap="wrap" sx={{
            '& .MuiBox-root': {
              display: 'inline-flex',
              flexDirection: 'column',
              flexWrap: 'wrap',
              background: `url(${UIRarity5Background}) no-repeat 0 0/cover`,
              margin: '0.5rem 0.65rem 0 0'
            },
            '& .MuiBox-root img': { width: 74, height: 'auto' },
            '& .MuiBox-root .MuiTypography-root': {
              textAlign: 'center',
              fontSize: '0.75rem',
              lineHeight: '1rem'
            }
          }}>
            {golds.map((item) => (
              <Box key={item.id}>
                <img src={item.iconUrl} alt={item.name} title={item.name} />
                <Typography>{item.pity}</Typography>
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>
    </Box>
  )
}

function computeGachaGolds (data: GachaLogItem[]) {
  const golds: Array<GoldMetadata> = []
  let pity = 0
  let sum = 0
  for (const item of data) {
    const isGold = item.rankType === '5'
    pity += 1
    if (isGold) {
      golds.push({
        id: item.id,
        name: item.name,
        pity,
        iconUrl: getGenshinIconUrl(item.name, item.itemType === '武器')
      })
      sum += 1
      pity = 0
    }
  }
  return { golds, pity, sum }
}
