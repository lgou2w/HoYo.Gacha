import React from 'react'
import { AccountFacet } from '@/interfaces/account'
import { createStatefulAccountLoader, withStatefulAccount } from '@/hooks/useStatefulAccount'
import { GachaRecordsContextProvider } from '@/hooks/useGachaRecords'
import Layout from '@/components/Layout'
import AccountMenu from '@/components/account/AccountMenu'
import GachaRecordsFetcher from '@/components/gacha/GachaRecordsFetcher'
import GachaRecordsOverview from '@/components/gacha/GachaRecordsOverview'
import Typography from '@mui/material/Typography'

export const loader = createStatefulAccountLoader(AccountFacet.Genshin)

export default withStatefulAccount(AccountFacet.Genshin, function Genshin ({ facet, selectedAccountUid }) {
  return (
    <Layout title="祈愿 · 原神" navbar={<AccountMenu />}>
      <GachaRecordsContextProvider facet={facet} uid={selectedAccountUid}>
        <Typography variant="h5">Genshin Impact</Typography>
        <GachaRecordsFetcher />
        <GachaRecordsOverview />
      </GachaRecordsContextProvider>
    </Layout>
  )
})
