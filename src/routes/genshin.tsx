import React from 'react'
import { AccountFacet } from '@/interfaces/account'
import { createStatefulAccountLoader, withStatefulAccount } from '@/hooks/useStatefulAccount'
import Layout from '@/components/Layout'
import AccountMenu from '@/components/account/AccountMenu'
import Typography from '@mui/material/Typography'

export const loader = createStatefulAccountLoader(AccountFacet.Genshin)

export default withStatefulAccount(AccountFacet.Genshin, function Genshin () {
  return (
    <Layout title="祈愿 · 原神" navbar={<AccountMenu facet={AccountFacet.Genshin} />}>
      <Typography variant="h5">Genshin Impact</Typography>
    </Layout>
  )
})
