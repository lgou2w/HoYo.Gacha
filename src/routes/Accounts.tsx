import React, { Fragment } from 'react'
import { Subtitle1 } from '@fluentui/react-components'
import { AccountFacets } from '@/api/interfaces/account'
import AccountsFacetView from '@/components/Accounts/FacetView'
import Locale from '@/components/Core/Locale'

export default function Accounts () {
  return (
    <Fragment>
      <Locale component={Subtitle1} as="h5" mapping={['components.accounts.title']} />
      {Object.entries(AccountFacets).map(([key, value]) => (
        <Fragment key={key}>
          <AccountsFacetView
            keyOfFacets={key as keyof typeof AccountFacets}
            facet={value}
          />
        </Fragment>
      ))}
    </Fragment>
  )
}
