import React, { PropsWithChildren } from 'react'
import { Account } from '@/api/interfaces/account'
import { useGachaRecordsQuery } from '@/api/queries/gacha'
import { BusinessContextState } from '@/components/BusinessProvider'
import { GachaRecordsContext, GachaRecordsContextState } from './Context'
import prettiedGachaRecords from './prettied'

export type { GachaRecordsContextState }

export default function GachaAccountProvider (
  props: PropsWithChildren<BusinessContextState & { activeAccount: Account | null }>
) {
  const { keyofBusinesses, business, activeAccount, children } = props
  const { data: records = null } = useGachaRecordsQuery(keyofBusinesses, activeAccount?.uid ?? null)
  const prettiedRecords = activeAccount && records
    ? prettiedGachaRecords(business, activeAccount.uid, records)
    : null

  const state = {
    keyofBusinesses,
    business,
    activeAccount,
    records,
    prettiedRecords
  }

  return (
    <GachaRecordsContext.Provider value={state}>
      {children}
    </GachaRecordsContext.Provider>
  )
}
