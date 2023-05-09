import React from 'react'
import Layout from '@/components/Layout'
import Typography from '@mui/material/Typography'

export default function Index () {
  return (
    <Layout title="主页">
      <Typography variant="h5">HoYo.Gacha</Typography>
      <Typography>An unofficial tool for managing and analyzing your miHoYo gacha records.</Typography>
      <Typography>一个非官方的工具，用于管理和分析你的 miHoYo 抽卡记录。</Typography>
    </Layout>
  )
}
