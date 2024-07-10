import React, { PropsWithChildren } from 'react'
import { useGachaRecordsQuery } from '@/api/queries/gacha'
import useGachaAccount from '@/components/GachaAccountProvider/useGachaAccount'
import { GachaRecordsContext, GachaRecordsContextState } from './Context'

export type { GachaRecordsContextState }

export default function GachaRecordsProvider (props: PropsWithChildren) {
  const { keyofBusinesses, business, selectedAccount: activeAccount } = useGachaAccount()
  const { data: records = null } = useGachaRecordsQuery(keyofBusinesses, activeAccount?.uid ?? null)

  const state = {
    keyofBusinesses,
    business,
    activeAccount,
    records
  }

  return (
    <GachaRecordsContext.Provider value={state}>
      {props.children}
    </GachaRecordsContext.Provider>
  )
}
