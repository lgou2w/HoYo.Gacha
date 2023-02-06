import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function IndexPage () {
  return (
    <Box className="page page-index">
      <Box>
        <Typography component="span" variant="h5" color="primary">
          Genshin Gacha
        </Typography>
        <Typography component="span" variant="subtitle1" color="grey.700" marginLeft={2}>
          用于获取导出原神祈愿记录的工具。
        </Typography>
      </Box>
    </Box>
  )
}
