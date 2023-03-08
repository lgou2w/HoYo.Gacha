import React from 'react'
import { SxProps, Theme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Grid from '@mui/material/Grid'
import GachaTabOverviewGridCard from './grid-card'
import { GroupedGachaLogs } from '@/hooks/useGachaLogsQuery'

export interface GachaTabOverviewGridCardsProps {
  values: GroupedGachaLogs['namedValues']
}

export default function GachaTabOverviewGridCards (props: GachaTabOverviewGridCardsProps) {
  const { values: { character, weapon, permanent, aggregated } } = props
  return (
    <Box sx={GachaTabOverviewGridCardsSx}>
      <FormControlLabel
        label="展开历史记录"
        labelPlacement="start"
        control={<Switch size="small" onChange={handleItemsCollapseChange} />}
      />
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
    </Box>
  )
}

const GachaTabOverviewGridCardsSx: SxProps<Theme> = {
  position: 'relative',
  '& > .MuiFormControlLabel-root': {
    position: 'absolute',
    right: 0,
    top: -24 - 8,
    margin: 0,
    '& > .MuiTypography-root': {
      fontSize: '0.875rem',
      color: 'grey.600'
    }
  }
}

function handleItemsCollapseChange (event: React.ChangeEvent<HTMLInputElement>) {
  const collapsed = event.target.checked
  document
    // See src\components\gacha\tab-overview\grid-card.tsx
    .querySelectorAll('.gacha-tab-overview-grid-card-items')
    .forEach((element) => {
      element.classList.toggle('collapsed', collapsed)
    })
}
