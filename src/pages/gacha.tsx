import React, { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Commands from '@/utilities/commands'
import { event } from '@tauri-apps/api'

// TODO: test code

export default function GachaPage () {
  const [status, setStatus] = useState<string>()
  const [data, setData] = useState<any[]>([])

  const handleClick = useCallback(() => {
    event
      .listen('gacha-log-fetcher-channel', (event) => {
        if (typeof event.payload === 'object' && event.payload) {
          if ('Status' in event.payload) {
            setStatus(event.payload.Status as string)
          } else if ('Data' in event.payload) {
            setData((prev) => {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              return [...prev, event.payload.Data as any]
            })
          }
        }
      })
      .then(async (unlisten) => {
        try {
          return await Commands.crateGachaLogFetcherChannel()
        } finally {
          unlisten()
        }
      })
      .catch((error) => console.error(error))
      .finally(() => { console.debug('done') })
  }, [setStatus, setData])

  return (
    <Box className="page page-gacha">
      <Typography>Gacha page</Typography>
      <Button variant="outlined" onClick={handleClick}>获取数据</Button>
      <Typography color="green">状态：{status || 'idle'}</Typography>
      <Box>
        {data.map((item) => (
          <Typography component="span" key={item.id}>{item.name}、</Typography>
        ))}
      </Box>
    </Box>
  )
}
