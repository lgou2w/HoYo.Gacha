import React from 'react'
import Box from '@mui/material/Box'
import { TabsProps } from '@mui/material/Tabs'
import GachaUrlAction from './gacha-url-action'
import GachaTabsAction from './gacha-tabs-action'
import GachaExtAction from './gacha-ext-action'
import { Account } from '@/interfaces/settings'

export type Action =
  'url-change' | 'url-copy' | 'url-fetch' |
  'gacha-import' | 'gacha-export'

export interface Props {
  account: Account
  tabs: string[]
  tabIndex: number
  onTabChange?: TabsProps['onChange']
  onSuccess?: (action: Action, message?: string) => void
  onError?: (error: Error | string) => void
  disabled?: boolean
}

export default function GachaActions (props: Props) {
  return (
    <Box display="flex" alignItems="center">
      <GachaUrlAction
        account={props.account}
        onSuccess={props.onSuccess}
        onError={props.onError}
        disabled={props.disabled}
      />
      <Box display="inline-flex" marginLeft="auto">
        <GachaTabsAction
          tabs={props.tabs}
          value={props.tabIndex}
          onChange={props.onTabChange}
          disabled={props.disabled}
        />
        <GachaExtAction
          account={props.account}
          onSuccess={props.onSuccess}
          onError={props.onError}
          disabled={props.disabled}
        />
      </Box>
    </Box>
  )
}
