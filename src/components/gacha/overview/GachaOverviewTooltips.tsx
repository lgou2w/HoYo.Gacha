import React from 'react'
import { resolveCurrency } from '@/interfaces/account'
import { useGachaLayoutContext } from '@/components/gacha/GachaLayoutContext'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import dayjs from '@/utilities/dayjs'

export default function GachaOverviewTooltips () {
  const { facet, gachaRecords } = useGachaLayoutContext()
  const { total, firstTime, lastTime } = gachaRecords
  const { currency, action } = resolveCurrency(facet)

  return (
    <Box>
      <Typography>
        {`· 总计${action} `}
        <Typography component="span" color="primary">
          {total}
        </Typography>
        {' 次，总价值 '}
        <Typography component="span" color="warning.light">
          {total * 160}
        </Typography>
        {` ${currency}。`}
        {'折合现金大约'}
        <Typography component="span" color="error">
          {'￥'}
          <Typography component="span" title="注：该金额并非实际充值金额，仅供参考。">
            {Math.floor(total * 160 / 8080) * 648}
          </Typography>
        </Typography>
        {' 元。'}
      </Typography>
      <Typography>
        {`· ${action}记录日期覆盖范围：`}
        <Typography component="span" color="secondary">
          {dayjs(firstTime).format('LLLL')}
        </Typography>
        {' ~ '}
        <Typography component="span" color="secondary">
        {dayjs(lastTime).format('LLLL')}
        </Typography>
        {'。'}
      </Typography>
      <Typography>
        {'· 因官方设定，最新数据存在约一小时的延迟。'}
        {'如遇到新池高峰期延迟可能更久。具体时间请以游戏内数据为准。'}
      </Typography>
    </Box>
  )
}
