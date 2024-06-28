import React, { Fragment } from 'react'
import { Subtitle1 } from '@fluentui/react-components'
import { Businesses } from '@/api/interfaces/account'
import AccountsBusinessView from '@/components/Accounts/BusinessView'
import Locale from '@/components/Core/Locale'

export default function Accounts () {
  return (
    <Fragment>
      <Locale component={Subtitle1} as="h5" mapping={['components.accounts.title']} />
      {Object.entries(Businesses).map(([key, value]) => (
        <AccountsBusinessView
          key={key}
          keyOfBusinesses={key as keyof typeof Businesses}
          business={value}
        />
      ))}
    </Fragment>
  )
}
