import React, { ReactNode } from 'react'
import { SxProps, Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { GroupedGachaLogs, NamedGachaLogs } from '@/hooks/useGachaLogsQuery'

export interface GachaTabDataSumProps {
  values: GroupedGachaLogs['namedValues']
}

export default function GachaTabDataSum (props: GachaTabDataSumProps) {
  const { values: { character, weapon, permanent, newbie, aggregated } } = props
  return (
    <Box className={GachaTabDataSumCls} sx={GachaTabDataSumSx}>
      <Typography variant="h6" gutterBottom>❖ 数据占比</Typography>
      <Stack flexDirection="row" gap={2}>
        <GachaTabDataSumCol title="出货数 / 率" values={['五星', '四星', '三星', '合计']} />
        <GachaTabDataSumCol title={character.categoryTitle} values={computeNamedGachaLogsValues(character)} />
        <GachaTabDataSumCol title={weapon.categoryTitle} values={computeNamedGachaLogsValues(weapon)} />
        <GachaTabDataSumCol title={permanent.categoryTitle} values={computeNamedGachaLogsValues(permanent)} />
        <GachaTabDataSumCol title={newbie.categoryTitle} values={computeNamedGachaLogsValues(newbie)} />
        <GachaTabDataSumCol title={aggregated.categoryTitle} values={computeNamedGachaLogsValues(aggregated)} />
      </Stack>
    </Box>
  )
}

function computeNamedGachaLogsValues (data: NamedGachaLogs) {
  const { metadata: { golden, purple, blue }, total } = data
  return [
    [golden.sum, golden.sumPercentage + '%', 'warning.main'],
    [purple.sum, purple.sumPercentage + '%', 'secondary.main'],
    [blue.sum, blue.sumPercentage + '%', 'info.main'],
    [total, total > 0 ? '100%' : '0%']
  ]
}

function GachaTabDataSumCol (props: {
  title: ReactNode,
  values: [ReactNode, ReactNode, string?][] | ReactNode[]
}) {
  const { title, values } = props
  return (
    <Stack className={`${GachaTabDataSumCls}-col`}>
      <Typography
        variant="body1"
        textAlign="center"
        bgcolor="grey.100"
      >
        {title}
      </Typography>
      {values.map((value, index) => (
        Array.isArray(value)
          ? <Box
              key={index}
              textAlign="center"
              color={value[2]}
            >
              <Typography component="span">{value[0]}</Typography>
              <Typography component="span" marginX={1} color="grey.800">/</Typography>
              <Typography component="span">{value[1]}</Typography>
            </Box>
          : <Typography
              key={index}
              textAlign="center"
              bgcolor="grey.100"
            >{value}</Typography>
      ))}
    </Stack>
  )
}

const GachaTabDataSumCls = 'gacha-tab-data-sum'
const GachaTabDataSumSx: SxProps<Theme> = {
  [`& .${GachaTabDataSumCls}-col`]: {
    width: 140,
    flexGrow: 1,
    fontSize: '1rem',
    border: 2,
    borderBottom: 0,
    borderColor: 'grey.300',
    borderRadius: 1,
    '& > *': {
      paddingY: 0.5,
      borderBottom: 2,
      borderColor: 'inherit'
    }
  }
}
