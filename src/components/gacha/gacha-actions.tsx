import React, { useMemo } from 'react'
import Box from '@mui/material/Box'
import { TabsProps } from '@mui/material/Tabs'
import GachaUrlAction from './gacha-url-action'
import GachaFetchAction from './gacha-fetch-action'
import GachaTabsAction from './gacha-tabs-action'
import GachaExtAction from './gacha-ext-action'
import { Account } from '@/interfaces/settings'
import { GachaLogItem } from '@/interfaces/models'

export type Action =
  'url-change' | 'url-copy' |
  'gacha-fetch' | 'gacha-import' | 'gacha-export'

export interface Props {
  account: Account
  data: Record<GachaLogItem['gachaType'], GachaLogItem[]>
  tabs: string[]
  tabIndex: number
  onTabChange?: TabsProps['onChange']
  onSuccess?: (action: Action, message?: string) => void
  onError?: (error: Error | string) => void
  disabled?: boolean
}

export default function GachaActions (props: Props) {
  const gachaTypesArguments: Partial<Record<GachaLogItem['gachaType'], string>> = useMemo(() => {
    const gachaTypeGroups = props.data
    const character = gachaTypeGroups[301][gachaTypeGroups[301].length - 1]?.id
    const character2 = gachaTypeGroups[400][gachaTypeGroups[400].length - 1]?.id
    return {
      100: gachaTypeGroups[100][gachaTypeGroups[100].length - 1]?.id,
      200: gachaTypeGroups[200][gachaTypeGroups[200].length - 1]?.id,
      301: character?.localeCompare(character2) > 0 ? character : character2,
      302: gachaTypeGroups[302][gachaTypeGroups[302].length - 1]?.id
    }
  }, [props.data])

  return (
    <Box display="flex" alignItems="stretch">
      <GachaUrlAction
        account={props.account}
        onSuccess={props.onSuccess}
        onError={props.onError}
        disabled={props.disabled}
      />
      <GachaFetchAction
        account={props.account}
        gachaTypesArguments={gachaTypesArguments}
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
