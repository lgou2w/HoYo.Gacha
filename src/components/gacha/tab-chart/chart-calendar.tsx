import React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ResponsiveTimeRange, CalendarDatum } from '@nivo/calendar'
import { GroupedGachaLogs } from '@/hooks/useGachaLogsQuery'
import dayjs from '@/utilities/dayjs'

export interface GachaTabChartCalendarProps {
  data: GroupedGachaLogs
}

export default function GachaTabChartCalendar (props: GachaTabChartCalendarProps) {
  const { data: { namedValues: { aggregated } } } = props
  const calendars = Object
    .entries(aggregated.values.reduce((acc, cur) => {
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
    }, [] as CalendarDatum[])

  const now = dayjs()
  const from = now.subtract(1, 'year')

  return (
    <Stack gap={2}>
      <Typography variant="h6" gutterBottom>❖ 祈愿日历</Typography>
      <Box position="relative" width="100%" height={200} sx={{ overflowX: 'clip', overflowY: 'visible' }}>
        <Stack position="absolute" fontSize={14} lineHeight="16px" gap="0.6px" left={8}>
          {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((text, index) => (
            <Typography key={index} variant="inherit">{text}</Typography>
          ))}
        </Stack>
        <ResponsiveTimeRange
          data={calendars}
          from={from.toDate()}
          to={now.toDate()}
          dayBorderColor="#fff"
          dayBorderWidth={2}
          dayRadius={5}
          daySpacing={1}
          emptyColor="#f5f5f5"
          colors={['#97e3d5', '#61cdbb', '#e8c1a0', '#f47560']}
          margin={{ right: 72 }}
          weekdayTicks={[]}
          weekdayLegendOffset={64}
          theme={{ fontFamily: 'inherit', fontSize: 14 }}
          legendFormat={value => `${value} 次`}
          legends={[
            {
              anchor: 'bottom',
              direction: 'row',
              itemCount: 4,
              itemHeight: 20,
              itemsSpacing: 48,
              itemWidth: 48,
              translateX: 0,
              translateY: -24
            }
          ]}
        />
      </Box>
    </Stack>
  )
}
