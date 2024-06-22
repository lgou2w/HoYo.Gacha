import React, { Fragment } from 'react'
import { Subtitle1 } from '@fluentui/react-components'
import { AccountBusinesses } from '@/api/interfaces/account'
import AccountsBusinessView from '@/components/Accounts/BusinessView'
import Locale from '@/components/Core/Locale'

export default function Accounts () {
  return (
    <Fragment>
      <Locale component={Subtitle1} as="h5" mapping={['components.accounts.title']} />
      {Object.entries(AccountBusinesses).map(([key, value]) => (
        <AccountsBusinessView
          key={key}
          keyOfBusinesses={key as keyof typeof AccountBusinesses}
          business={value}
        />
      ))}
    </Fragment>
  )
}
