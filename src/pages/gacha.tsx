import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import useGachaLogFetcherChannel from '@/hooks/useGachaLogFetcherChannel'

export default function GachaPage () {
  // TODO: Test
  const { error, status, data, start } = useGachaLogFetcherChannel({
    channelName: 'test',
    gachaUrl: 'your gacha url',
    gachaTypes: ['200']
  })

  return (
    <Box className="page page-gacha">
      <Typography>Gacha page</Typography>
      <Button variant="outlined" onClick={start}>获取数据</Button>
      <Typography color="green" marginY={1}>状态：{error || status || 'idle'}</Typography>
      <Box>
        {data.map((item) => (
          <Box key={item.id} display="inline" marginRight={1} color={
            item.rankType === '5'
              ? 'orange'
              : item.rankType === '4'
                ? 'blue'
                : 'inherit'
          }>{item.name}</Box>
        ))}
      </Box>
    </Box>
  )
}
