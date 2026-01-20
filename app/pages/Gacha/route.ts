import { Spinner } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
import { AccountBusiness, KeyofAccountBusiness, isValidAccountBusiness } from '@/api/schemas/Account'
import i18n, { KnownLanguages, Language } from '@/i18n'
import rootRoute from '@/pages/Root/route'
import GachaLayout from './layout'
import { ensureAccountsQueryData, ensureSelectedAccountUidQueryData } from './queries/accounts'
import { prefetchPrettizedRecordsQuery } from './queries/prettizedRecords'

const gachaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/Gacha/$keyofAccountBusiness',
  shouldReload: false,
  component: GachaLayout,
  pendingComponent: Spinner,
  async loader (ctx) {
    console.debug(`===== Gacha Route Loader =====: ${ctx.params.keyofAccountBusiness}`)

    const keyof = ctx.params.keyofAccountBusiness as KeyofAccountBusiness
    const business: AccountBusiness | undefined = AccountBusiness[keyof]

    if (!isValidAccountBusiness(business)) {
      throw new Error(`Invalid path parameter gacha business: ${keyof}`)
    }

    const language = KnownLanguages[i18n.language as Language]
    console.debug('Current language:', language)

    // Preload query data
    console.debug(`===== Gacha Route Preload Query Data =====`)

    await ensureAccountsQueryData(keyof)
    const selectedAccountUid = await ensureSelectedAccountUidQueryData(keyof)
    await prefetchPrettizedRecordsQuery(business, selectedAccountUid, language.constants.gacha)
    //

    return {
      business,
    }
  },
})

export default gachaRoute
