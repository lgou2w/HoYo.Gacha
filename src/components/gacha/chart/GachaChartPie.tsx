import React from 'react'
import { AccountFacet } from '@/interfaces/account'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import { ResponsivePie, PieSvgProps, MayHaveLabel } from '@nivo/pie'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function GachaChartCalendar () {
  const { facet, gachaRecords: { aggregatedValues, namedValues: { character, weapon, permanent, newbie } } } = useGachaLayoutContext()

  const itemTypesData = aggregatedValues.values.reduce((acc, cur) => {
    const key = cur.item_type
    if (!acc[key]) {
      acc[key] = 1
    } else {
      acc[key] += 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <Stack direction="column" gap={2}>
      <Typography variant="h6" gutterBottom>❖ 多维饼图</Typography>
      <Grid container>
        <Grid sm={4} item>
          <Box width="100%" height={256}>
            <ResponsivePie
              {...PieProps}
              data={[
                { id: '三星', value: aggregatedValues.metadata.blue.sum },
                { id: '四星', value: aggregatedValues.metadata.purple.sum },
                { id: '五星', value: aggregatedValues.metadata.golden.sum }
              ]}
            />
          </Box>
        </Grid>
        <Grid sm={4} item>
          <Box width="100%" height={256}>
            <ResponsivePie
              {...PieProps}
              data={[
                { id: '角色', value: itemTypesData['角色'] || 0 },
                {
                  id: facet === AccountFacet.Genshin ? '武器' : '光锥',
                  value: itemTypesData[facet === AccountFacet.Genshin ? '武器' : '光锥'] || 0
                }
              ]}
            />
          </Box>
        </Grid>
        <Grid sm={4} item>
          <Box width="100%" height={256} overflow="hidden">
            <ResponsivePie
              {...PieProps}
              arcLabelsSkipAngle={10}
              arcLinkLabelsSkipAngle={10}
              data={[
                { id: '角色池', value: character.total },
                {
                  id: facet === AccountFacet.Genshin ? '武器池' : '光锥池',
                  value: weapon.total
                },
                { id: '常驻池', value: permanent.total },
                { id: '新手池', value: newbie.total }
              ]}
            />
          </Box>
        </Grid>
      </Grid>
    </Stack>
  )
}

const PieProps: Partial<PieSvgProps<MayHaveLabel & Record<string, unknown>>> = {
  theme: {
    fontFamily: 'inherit',
    fontSize: 14
  },
  margin: { top: 36, right: 36, bottom: 60, left: 36 },
  colors: ['#0288d188', '#9c27b088', '#ed6c0288', '#f4433688'],
  fill: [{ id: 'lines', match: '*' }],
  defs: [
    {
      id: 'lines',
      type: 'patternLines',
      background: 'inherit',
      color: 'rgba(255, 255, 255, 0.3)',
      rotation: -45,
      lineWidth: 6,
      spacing: 10
    }
  ],
  legends: [
    {
      anchor: 'bottom',
      direction: 'row',
      translateY: 56,
      translateX: 0,
      itemWidth: 72,
      itemHeight: 14,
      symbolSize: 14,
      symbolShape: 'square'
    }
  ],
  activeOuterRadiusOffset: 4,
  arcLinkLabelsColor: { from: 'color' },
  arcLinkLabelsThickness: 2,
  borderColor: { from: 'color' },
  borderWidth: 2,
  cornerRadius: 3,
  innerRadius: 0.4,
  padAngle: 3
}
