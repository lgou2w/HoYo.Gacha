import React from 'react'
import Page from '@/components/page'
import AccountActionsBar from '@/components/account/actions-bar'
import AccountList from '@/components/account/list'

export default function PageAccount () {
  return (
    <Page>
      <AccountActionsBar />
      <AccountList />
    </Page>
  )
}
