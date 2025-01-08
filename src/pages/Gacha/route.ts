import { createRoute } from '@tanstack/react-router'
import { accountsQueryOptions } from '@/api/queries/account'
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

    // TODO:
    //   1. Load accounts
    //   2. Get current activated account (CAC)
    //   3. Preload CAC gacha records...
    await queryClient.ensureQueryData(accountsQueryOptions(keyofBusinesses))

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
      'Error: ' + (error instanceof Error ? error.message : String(error))
    )
  },
})

export default gachaRoute
