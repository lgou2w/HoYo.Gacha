import React from 'react'
import { AccountFacet } from '@/interfaces/account'
import { createStatefulAccountLoader, withStatefulAccount } from '@/hooks/useStatefulAccount'
import Layout from '@/components/Layout'
import AccountMenu from '@/components/account/AccountMenu'
import GachaLayout from '@/components/gacha/GachaLayout'

export const loader = createStatefulAccountLoader(AccountFacet.StarRail)

export default withStatefulAccount(AccountFacet.StarRail, function StarRail () {
  return (
    <Layout title="跃迁 · 崩坏：星穹铁道" navbar={<AccountMenu />}>
      <GachaLayout />
    </Layout>
  )
})
