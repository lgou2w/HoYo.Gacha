import React from 'react'
import Box from '@mui/material/Box'
import { TabsProps } from '@mui/material/Tabs'
import GachaUrlAction from './gacha-url-action'
import GachaTabsAction from './gacha-tabs-action'
import GachaExtAction from './gacha-ext-action'

interface Props {
  tabs: string[]
  tabIndex: number
  onTabChange?: TabsProps['onChange']
  disabled?: boolean
}

export default function GachaActions (props: Props) {
  return (
    <Box display="flex" alignItems="center">
      <GachaUrlAction disabled={props.disabled} />
      <Box display="inline-flex" marginLeft="auto">
        <GachaTabsAction tabs={props.tabs} value={props.tabIndex} onChange={props.onTabChange} disabled={props.disabled} />
        <GachaExtAction disabled={props.disabled} />
      </Box>
    </Box>
  )
}
