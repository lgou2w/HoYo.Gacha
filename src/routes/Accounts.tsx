import React, { Fragment } from 'react'
import { Subtitle1 } from '@fluentui/react-components'
import { Businesses, KeyofBusinesses } from '@/api/interfaces/account'
import Locale from '@/components/Commons/Locale'
import AccountsBusinessView from '@/pages/Accounts/BusinessView'

export default function Accounts () {
  return (
    <Fragment>
      <Locale component={Subtitle1} as="h5" mapping={['Pages.Accounts.Title']} />
      {Object.entries(Businesses).map(([key, value]) => (
        <AccountsBusinessView
          key={key}
          keyofBusinesses={key as KeyofBusinesses}
          business={value}
        />
      ))}
    </Fragment>
  )
}
