import React from 'react'
import { AccountFacet } from '@/interfaces/account'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import { ResponsivePie, PieSvgProps, MayHaveLabel } from '@nivo/pie'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function GachaChartCalendar () {
  const {
    facet,
    gachaRecords: {
      aggregatedValues,
      namedValues: {
        character,
        weapon,
        permanent,
        newbie,
        anthology,
        bangboo,
        collaborationCharacter,
        collaborationWeapon
      }
    }
  } = useGachaLayoutContext()

  const itemTypesData = Array
    .from(aggregatedValues.values)
    .concat(bangboo?.values || [])
    .reduce((acc, cur) => {
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
          <Typography variant="subtitle1" textAlign="center" gutterBottom>➤ 星级</Typography>
          <Box width="100%" height={256}>
            <ResponsivePie
              {...PieProps}
              data={[
                {
                  id: '三星',
                  value: aggregatedValues.metadata.blue.sum + (bangboo?.metadata.blue.sum || 0)
                },
                {
                  id: '四星',
                  value: aggregatedValues.metadata.purple.sum + (bangboo?.metadata.purple.sum || 0)
                },
                {
                  id: '五星',
                  value: aggregatedValues.metadata.golden.sum + (bangboo?.metadata.golden.sum || 0)
                }
              ]}
            />
          </Box>
        </Grid>
        <Grid sm={4} item>
          <Typography variant="subtitle1" textAlign="center" gutterBottom>➤ 类别</Typography>
          <Box width="100%" height={256}>
            <ResponsivePie
              {...PieProps}
              data={
                facet === AccountFacet.Genshin
                  ? [
                      { id: '角色', value: itemTypesData['角色'] || 0 },
                      { id: '武器', value: itemTypesData['武器'] || 0 }
                    ]
                  : facet === AccountFacet.StarRail
                    ? [
                        { id: '角色', value: itemTypesData['角色'] || 0 },
                        { id: '光锥', value: itemTypesData['光锥'] || 0 }
                      ]
                    : facet === AccountFacet.ZenlessZoneZero
                      ? [
                          { id: '代理人', value: itemTypesData['代理人'] || 0 },
                          { id: '音擎', value: itemTypesData['音擎'] || 0 },
                          { id: '邦布', value: itemTypesData['邦布'] || 0 }
                        ]
                      : []
              }
            />
          </Box>
        </Grid>
        <Grid sm={4} item>
          <Typography variant="subtitle1" textAlign="center" gutterBottom>➤ 卡池</Typography>
          <Box width="100%" height={256} overflow="hidden">
            <ResponsivePie
              {...PieProps}
              arcLabelsSkipAngle={10}
              arcLinkLabelsSkipAngle={10}
              data={
                facet === AccountFacet.Genshin
                  ? [
                      { id: '角色', value: character.total },
                      { id: '武器', value: weapon.total },
                      { id: '常驻', value: permanent.total },
                      { id: '新手', value: newbie.total },
                      { id: '集录', value: anthology?.total || 0 }
                    ]
                  : facet === AccountFacet.StarRail
                    ? [
                        { id: '角色', value: character.total },
                        { id: '光锥', value: weapon.total },
                        ...(collaborationCharacter ? [{ id: '角联', value: collaborationCharacter.total }] : []),
                        ...(collaborationWeapon ? [{ id: '光联', value: collaborationWeapon.total }] : []),
                        { id: '常驻', value: permanent.total },
                        { id: '新手', value: newbie.total }
                      ]
                    : facet === AccountFacet.ZenlessZoneZero
                      ? [
                          { id: '独家', value: character.total },
                          { id: '音擎', value: weapon.total },
                          { id: '常驻', value: permanent.total },
                          { id: '邦布', value: bangboo?.total || 0 }
                        ]
                      : []
              }
            />
          </Box>
        </Grid>
      </Grid>
    </Stack>
  )
}

const PieProps: Partial<PieSvgProps<MayHaveLabel & Record<string, unknown>>> = {
  theme: {
    text: {
      fontFamily: 'inherit',
      fontSize: 14
    }
  },
  margin: { top: 36, right: 36, bottom: 60, left: 36 },
  colors: ['#0288d188', '#9c27b088', '#ed6c0288', '#f4433688', '#003cff88'],
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
      itemWidth: 64,
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
