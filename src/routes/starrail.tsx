import React from 'react'
import { AccountFacet } from '@/interfaces/account'
import { createStatefulAccountLoader, withStatefulAccount } from '@/hooks/useStatefulAccount'
import { GachaRecordsContextProvider } from '@/hooks/useGachaRecords'
import Layout from '@/components/Layout'
import AccountMenu from '@/components/account/AccountMenu'
import GachaRecordsFetcher from '@/components/gacha/GachaRecordsFetcher'
import Typography from '@mui/material/Typography'

export const loader = createStatefulAccountLoader(AccountFacet.StarRail)

export default withStatefulAccount(AccountFacet.StarRail, function StarRail ({ facet, selectedAccountUid }) {
  return (
    <Layout title="跃迁 · 崩坏：星穹铁道" navbar={<AccountMenu />}>
      <GachaRecordsContextProvider facet={facet} uid={selectedAccountUid}>
        <Typography variant="h5">Honkai: Star Rail</Typography>
        <GachaRecordsFetcher />
      </GachaRecordsContextProvider>
    </Layout>
  )
})
