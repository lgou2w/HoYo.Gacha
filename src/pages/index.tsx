import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import FavoriteIcon from '@mui/icons-material/Favorite'

export default function IndexPage () {
  return (
    <Box className="page page-index">
      <Box>
        <Typography component="span" variant="h5" color="primary">
          Genshin Gacha
        </Typography>
        <Typography component="span" variant="subtitle1" color="grey.800" marginLeft={2}>
          用于获取导出原神祈愿记录的工具。
        </Typography>
        <Box>
          <Typography component="span" variant="body1" color="grey.900" marginLeft={0.5}>
            {`v${__APP_VERSION__}`}
          </Typography>
          <Typography component="span" variant="body2" color="grey.800" marginLeft={1}>
            {' Made with '}
            <Link href="https://tauri.app" target="_blank" rel="external nofollow">Tauri</Link>
            {', '}
            <Link href="https://reactjs.org" target="_blank" rel="external nofollow">React</Link>
            {', '}
            <Link href="https://rust-lang.org" target="_blank" rel="external nofollow">Rust</Link>
            {' and '}
            <FavoriteIcon color="error" fontSize="inherit" sx={{ marginBottom: -0.3 }} />
            {' by '}
            <Link href="https://github.com/lgou2w" target="_blank" rel="external nofollow">lgou2w</Link>
            .
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
