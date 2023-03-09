import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import dayjs from '@/utilities/dayjs'

export interface GachaTabOverviewTooltipsProps {
  total: number
  firstTime?: string
  lastTime?: string
}

export default function GachaTabOverviewTooltips (props: GachaTabOverviewTooltipsProps) {
  return (
    <Box>
      <Typography>
        {'❖ 共计祈愿 '}
        <Typography component="span" color="primary">
          {props.total}
        </Typography>
        {' 次，总价值 '}
        <Typography component="span" color="warning.light">
          {props.total * 160}
        </Typography>
        {' 原石。'}
        {'折合现金大约'}
        <Typography component="span" color="error">
          {'￥'}
          <Typography component="span" title="注：该金额并非实际充值金额，仅供参考。" sx={{
            textDecoration: 'underline dotted',
            textUnderlineOffset: '4px'
          }}>
            {Math.floor(props.total * 160 / 8080) * 648}
          </Typography>
        </Typography>
        {' 元。'}
      </Typography>
      <Typography>
        {'❖ 祈愿记录日期覆盖范围：'}
        <Typography component="span" color="secondary">
          {dayjs(props.firstTime).format('lll')}
        </Typography>
        {' ~ '}
        <Typography component="span" color="secondary">
        {dayjs(props.firstTime).format('lll')}
        </Typography>
        {'。'}
      </Typography>
      <Typography>
        {'❖ 因官方设定，最新数据存在约一小时的延迟。'}
        {'如遇到新池高峰期延迟可能更久。具体时间请以游戏内数据为准。'}
      </Typography>
    </Box>
  )
}
