import React from 'react'
import AccountBusiness, { AccountBusinessContextState } from '@/components/AccountBusiness'
import GachaBusinessViewAccountSelect from './AccountSelect'

export default function GachaBusinessView (props: AccountBusinessContextState) {
  const { keyOfBusinesses, business } = props
  return (
    <AccountBusiness keyOfBusinesses={keyOfBusinesses} business={business}>
      <div>
        <GachaBusinessViewAccountSelect />
      </div>
    </AccountBusiness>
  )
}
