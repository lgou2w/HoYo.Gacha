import React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { ResponsivePie, PieSvgProps } from '@nivo/pie'
import { GroupedGachaLogs } from '@/hooks/useGachaLogsQuery'

export interface GachaTabChartPieProps {
  data: GroupedGachaLogs
}

export default function GachaTabChartPie (props: GachaTabChartPieProps) {
  const { data: { namedValues: { character, weapon, permanent, newbie, aggregated } } } = props
  const itemTypesData = aggregated.values.reduce((acc, cur) => {
    switch (cur.itemType) {
      case '角色': acc.character += 1; break
      case '武器': acc.weapon += 1; break
      default: break
    }
    return acc
  }, { character: 0, weapon: 0 })

  return (
    <Stack gap={2}>
      <Typography variant="h6" gutterBottom>❖ 饼图</Typography>
      <Grid container>
        <Grid sm={4} item>
          <Box width="100%" height={256}>
            <ResponsivePie
              {...PieProps}
              data={[
                { id: '三星', value: aggregated.metadata.blue.sum },
                { id: '四星', value: aggregated.metadata.purple.sum },
                { id: '五星', value: aggregated.metadata.golden.sum }
              ]}
            />
          </Box>
        </Grid>
        <Grid sm={4} item>
          <Box width="100%" height={256}>
            <ResponsivePie
              {...PieProps}
              data={[
                { id: '角色', value: itemTypesData.character },
                { id: '武器', value: itemTypesData.weapon }
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
                { id: '武器池', value: weapon.total },
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

const PieProps: Partial<PieSvgProps<unknown>> = {
  theme: {
    fontFamily: 'inherit',
    fontSize: 14,
    tooltip: {
      basic: { fontSize: 12 }
    }
  },
  margin: { top: 36, right: 36, bottom: 60, left: 36 },
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
      translateY: 48,
      translateX: 0,
      itemWidth: 72,
      itemHeight: 14,
      symbolSize: 14,
      symbolShape: 'circle'
    }
  ],
  activeOuterRadiusOffset: 4,
  // arcLabelsTextColor: { from: 'color', modifiers: [['darker', 2]] },
  arcLinkLabelsColor: { from: 'color' },
  arcLinkLabelsThickness: 2,
  borderColor: { from: 'color' },
  borderWidth: 2,
  cornerRadius: 3,
  innerRadius: 0.4,
  padAngle: 3
}
