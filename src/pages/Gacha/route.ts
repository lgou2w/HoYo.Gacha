import { Spinner } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
import { isDetailedError } from '@/api/error'
import { ensureAccountsQueryData, ensureSelectedAccountUidQueryData } from '@/api/queries/accounts'
import { prefetchFirstGachaRecordQuery, prefetchPrettizedGachaRecordsQuery } from '@/api/queries/business'
import i18n from '@/i18n'
import { KnownLanguages, Language } from '@/i18n/locales'
import { Business, Businesses, KeyofBusinesses } from '@/interfaces/Business'
import RootRoute from '@/pages/Root/route'
import Routes from '@/routes'
import Gacha from '.'

const GachaRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: Routes.Gacha,
  async loader (ctx) {
    const keyofBusinesses = ctx.params.keyofBusinesses as KeyofBusinesses
    const business: Business | undefined = Businesses[keyofBusinesses]

    // You can't use `!business` because 0 is also a valid value.
    if (business === null || typeof business === 'undefined') {
      throw new Error(`Invalid path parameter business: ${keyofBusinesses}`)
    }

    const language = KnownLanguages[i18n.language as Language]
    console.debug('Current language:', language)

    // Gacha business data loading strategy:
    //   1. Load all accounts
    //   2. Get current selected account
    //   3. Preload account gacha records
    await ensureAccountsQueryData(keyofBusinesses)
    const selectedAccountUid = await ensureSelectedAccountUidQueryData(keyofBusinesses)
    await prefetchPrettizedGachaRecordsQuery(business, selectedAccountUid, language.constants.gacha)
    await prefetchFirstGachaRecordQuery(business, selectedAccountUid)

    return {
      business,
      keyofBusinesses,
    }
  },
  component: Gacha,
  pendingComponent: Spinner,
  errorComponent: ({ error }) => {
    // TODO
    return (
      'Error: ' + (isDetailedError(error) || error instanceof Error ? error.message : String(error))
    )
  },
})

export default GachaRoute
