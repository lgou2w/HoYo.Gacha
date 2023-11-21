import React, { Fragment } from 'react'
import { Subtitle1 } from '@fluentui/react-components'
import { AccountFacets } from '@/api/interfaces/account'
import Locale from '@/components/Core/Locale'
import AccountsFacetView from '@/components/Routes/Accounts/FacetView'

export default function Accounts () {
  return (
    <Fragment>
      <Locale component={Subtitle1} as="h5" mapping={['components.routes.accounts.title']} />
      {Object.entries(AccountFacets).map(([key, value]) => (
        <Fragment key={key}>
          <AccountsFacetView facetEntry={{ key: key as keyof typeof AccountFacets, value }} />
        </Fragment>
      ))}
    </Fragment>
  )
}
