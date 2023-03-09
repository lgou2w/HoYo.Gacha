import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import GachaTabOverviewGridCard from './grid-card'
import { GroupedGachaLogs } from '@/hooks/useGachaLogsQuery'

export interface GachaTabOverviewGridCardsProps {
  values: GroupedGachaLogs['namedValues']
}

export default function GachaTabOverviewGridCards (props: GachaTabOverviewGridCardsProps) {
  const { values: { character, weapon, permanent, aggregated } } = props
  return (
    <Box>
      <Grid spacing={3} container>
        <Grid xs={6} item>
          <GachaTabOverviewGridCard value={character} />
        </Grid>
        <Grid xs={6} item>
          <GachaTabOverviewGridCard value={weapon} />
        </Grid>
        <Grid xs={6} item>
          <GachaTabOverviewGridCard value={permanent} />
        </Grid>
        <Grid xs={6} item>
          <GachaTabOverviewGridCard value={aggregated} />
        </Grid>
      </Grid>
    </Box>
  )
}
