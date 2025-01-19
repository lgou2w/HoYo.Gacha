import { createRoute } from '@tanstack/react-router'
import { isDetailedError } from '@/api/error'
import { accountsQueryOptions, selectedAccountQueryOptions } from '@/api/queries/account'
import { prettizedGachaRecordsQueryOptions } from '@/api/queries/business'
import { Business, Businesses, KeyofBusinesses } from '@/interfaces/Business'
import rootRoute from '@/pages/Root/route'
import queryClient from '@/queryClient'
import Gacha from '.'

const gachaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gacha/$business',
  async loader (ctx) {
    const keyofBusinesses: KeyofBusinesses = ctx.params.business as KeyofBusinesses
    const business: Business | undefined = Businesses[keyofBusinesses]

    // You can't use `!business` because 0 is also a valid value.
    if (business === null || typeof business === 'undefined') {
      throw new Error(`Invalid path parameter business: ${keyofBusinesses}`)
    }

    // Gacha business data loading strategy:
    //   1. Load all accounts
    //   2. Get current selected account
    //   3. Preload account gacha records
    await queryClient.ensureQueryData(accountsQueryOptions(keyofBusinesses))
    const selectedAccount = await queryClient.ensureQueryData(selectedAccountQueryOptions(keyofBusinesses))
    queryClient.prefetchQuery(prettizedGachaRecordsQueryOptions(
      business,
      selectedAccount?.uid ?? null,
    ))

    return {
      business,
      keyofBusinesses,
    }
  },
  component: Gacha,
  pendingComponent: function Pending () {
    // TODO
    return (
      'loading...'
    )
  },
  errorComponent: ({ error }) => {
    // TODO
    return (
      'Error: ' + (isDetailedError(error) || error instanceof Error ? error.message : String(error))
    )
  },
})

export default gachaRoute
