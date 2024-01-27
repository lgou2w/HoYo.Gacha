import React from 'react'
import GachaOverviewLastUpdated from '@/components/gacha/overview/GachaOverviewLastUpdated'
import GachaOverviewGrid from '@/components/gacha/overview/GachaOverviewGrid'
import GachaOverviewTags from '@/components/gacha/overview/GachaOverviewTags'
import GachaOverviewTooltips from '@/components/gacha/overview/GachaOverviewTooltips'
import Stack from '@mui/material/Stack'

export default function GachaOverview () {
  return (
    <Stack direction="column" spacing={2}>
      <GachaOverviewLastUpdated />
      <GachaOverviewGrid />
      <GachaOverviewTags />
      <GachaOverviewTooltips />
    </Stack>
  )
}
