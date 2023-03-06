import React from 'react'
import Page from '@/components/page'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ExternalLink from '@/components/common/external-link'

export default function PageHome () {
  return (
    <Page>
      <Box>
        <Typography component="span" variant="h5" color="primary">
          Genshin Gacha
        </Typography>
        <Typography component="span" variant="subtitle1" color="grey.800" marginLeft={2}>
          管理和分析你的原神祈愿记录。
        </Typography>
        <Box>
          <Typography component="span" variant="body1" color="grey.900" marginLeft={0.5}>
            {`v${__APP_VERSION__}`}
          </Typography>
          <Typography component="span" variant="body2" color="grey.800" marginLeft={1}>
            {'Made with '}
            <ExternalLink href="https://tauri.app">Tauri</ExternalLink>
            {', '}
            <ExternalLink href="https://reactjs.org">React</ExternalLink>
            {', '}
            <ExternalLink href="https://rust-lang.org">Rust</ExternalLink>
            {' and '}
            <FavoriteIcon color="error" fontSize="inherit" sx={{ marginBottom: -0.3 }} />
            {' by '}
            <ExternalLink href="https://github.com/lgou2w">lgou2w</ExternalLink>
            {'.'}
          </Typography>
        </Box>
      </Box>
    </Page>
  )
}
