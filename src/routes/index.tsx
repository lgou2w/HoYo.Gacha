import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import Version from '@/components/common/Version'
import Typography from '@mui/material/Typography'
import MuiLink from '@mui/material/Link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InfoIcon from '@mui/icons-material/InfoOutlined'

export default function Index () {
  return (
    <Layout title="主页">
      <Typography variant="h5">
        <MuiLink href={__APP_REPOSITORY__} target="_blank" rel="noreferrer">
          HoYo.Gacha
        </MuiLink>
        &nbsp;&nbsp;
        <Version variant="caption" />
      </Typography>
      <Typography>An unofficial tool for managing and analyzing your miHoYo gacha records.</Typography>
      <Typography>一个非官方的工具，用于管理和分析你的 miHoYo 抽卡记录。</Typography>
      <Box>
        <Button component={Link} to="/setting"
          variant="outlined"
          color="info"
          startIcon={<InfoIcon />}
        >
          关于
        </Button>
      </Box>
    </Layout>
  )
}
