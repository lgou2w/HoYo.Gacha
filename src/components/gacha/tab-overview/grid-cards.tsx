import React from 'react'
import Grid from '@mui/material/Grid'
import GachaTabOverviewGridCard from './grid-card'
import { GroupedGachaLogs } from '@/hooks/useGachaLogsQuery'

export interface GachaTabOverviewGridCardsProps {
  values: GroupedGachaLogs['namedValues']
}

export default function GachaTabOverviewGridCards (props: GachaTabOverviewGridCardsProps) {
  const { values: { character, weapon, permanent, aggregated } } = props
  return (
    <Grid spacing={3} container>
      <Grid xs={6} item>
        <GachaTabOverviewGridCard category={'character'} value={character} />
      </Grid>
      <Grid xs={6} item>
        <GachaTabOverviewGridCard category={'weapon'} value={weapon} />
      </Grid>
      <Grid xs={6} item>
        <GachaTabOverviewGridCard category={'permanent'} value={permanent} />
      </Grid>
      <Grid xs={6} item>
        <GachaTabOverviewGridCard category={'aggregated'} value={aggregated} />
      </Grid>
    </Grid>
  )
}
