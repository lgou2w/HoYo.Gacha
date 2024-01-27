import React, { useMemo } from 'react'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import { resolveCurrency } from '@/interfaces/account'
import { SxProps, Theme } from '@mui/material'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import dayjs from '@/utilities/dayjs'

export default function GachaOverviewTags () {
  const { facet, gachaRecords: { aggregatedValues } } = useGachaLayoutContext()
  const { action } = resolveCurrency(facet)
  const { luck, unluck, related, crazy } = useMemo(() => {
    const sortByUsedPity = Array.from(aggregatedValues.metadata.golden.values).sort((a, b) => a.usedPity - b.usedPity)

    const luck = sortByUsedPity[0]
    const unluck = sortByUsedPity[sortByUsedPity.length - 1]

    const countGroups = aggregatedValues.metadata.golden.values.reduce((acc, value) => {
      (acc[value.name] || (acc[value.name] = [])).push(value)
      return acc
    }, {} as Record<string, typeof aggregatedValues.metadata.golden.values>)

    const related = Object
      .entries(countGroups)
      .sort((a, b) => b[1].length - a[1].length)[0]

    const crazy = Object
      .entries(aggregatedValues.values.reduce((acc, cur) => {
        const key = dayjs(cur.time).format('YYYY-MM-DD')
        if (!acc[key]) {
          acc[key] = 1
        } else {
          acc[key] += 1
        }
        return acc
      }, {} as Record<string, number>))
      .reduce((acc, [key, value]) => {
        acc.push({ day: key, value })
        return acc
      }, [] as Array<{ day: string, value: number }>)
      .sort((a, b) => b.value - a.value)[0]

    return {
      luck: luck ? { name: luck.name, total: luck.usedPity } : null,
      unluck: unluck ? { name: unluck.name, total: unluck.usedPity } : null,
      related: related && related[1].length > 1 ? { name: related[0], total: related[1].length } : null,
      crazy: crazy ? { name: crazy.day, total: crazy.value } : null
    }
  }, [aggregatedValues])

  return (
    <Box>
      <Typography variant="body1" gutterBottom>
        {`❖ ${action}标签`}
      </Typography>
      <Stack sx={GachaOverviewTagsSx}>
        {luck && <Chip className="luck" label={`最幸运的五星：${luck.name}，${luck.total} 抽就出啦！`} />}
        {unluck && <Chip className="unluck" label={`最非酋的五星：${unluck.name}，共花费 ${unluck.total} 抽才出。。`} />}
        {related && <Chip className="related" label={`最有缘的五星：${related.name}，重复抽到了 ${related.total} 次。`} />}
        {crazy && <Chip className="crazy" label={`最疯狂的一天：${crazy.name}，这天一共抽了 ${crazy.total} 次！`} />}
      </Stack>
    </Box>
  )
}

const GachaOverviewTagsSx: SxProps<Theme> = {
  gap: 1,
  flexWrap: 'wrap',
  flexDirection: 'row',
  fontSize: '0.875rem',
  paddingLeft: 2,
  '& > .MuiChip-root': {
    fontSize: 'inherit',
    color: 'white',
    marginLeft: 1,
    '&.luck': { backgroundColor: 'goldenrod' },
    '&.unluck': { backgroundColor: '#505a6d' },
    '&.related': { backgroundColor: '#8ab648' },
    '&.crazy': { backgroundColor: '#9d78d2' }
  }
}
