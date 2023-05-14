import React from 'react'
import { AccountFacet } from '@/interfaces/account'
import { createStatefulAccountLoader, withStatefulAccount } from '@/hooks/useStatefulAccount'
import Layout from '@/components/Layout'
import AccountMenu from '@/components/account/AccountMenu'
import GachaLayout from '@/components/gacha/GachaLayout'

export const loader = createStatefulAccountLoader(AccountFacet.Genshin)

export default withStatefulAccount(AccountFacet.Genshin, function Genshin () {
  return (
    <Layout title="祈愿 · 原神" navbar={<AccountMenu />}>
      <GachaLayout />
    </Layout>
  )
})
