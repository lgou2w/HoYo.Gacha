import React from 'react'
import GachaAnalysisSum from '@/components/gacha/analysis/GachaAnalysisSum'
import GachaAnalysisHistory from '@/components/gacha/analysis/GachaAnalysisHistory'
import Stack from '@mui/material/Stack'

export default function GachaAnalysis () {
  return (
    <Stack direction="column" spacing={2}>
      <GachaAnalysisSum />
      <GachaAnalysisHistory />
    </Stack>
  )
}
