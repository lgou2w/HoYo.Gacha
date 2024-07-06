import React from 'react'
import { AccountFacet } from '@/interfaces/account'
import { createStatefulAccountLoader, withStatefulAccount } from '@/hooks/useStatefulAccount'
import Layout from '@/components/Layout'
import AccountMenu from '@/components/account/AccountMenu'
import GachaLayout from '@/components/gacha/GachaLayout'

export const loader = createStatefulAccountLoader(AccountFacet.ZenlessZoneZero)

export default withStatefulAccount(AccountFacet.ZenlessZoneZero, function ZenlessZoneZero () {
  return (
    <Layout title="调频 · 绝区零" navbar={<AccountMenu />}>
      <GachaLayout />
    </Layout>
  )
})
