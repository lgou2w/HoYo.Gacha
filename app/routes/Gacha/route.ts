import { Spinner } from '@fluentui/react-components'
import { createRoute } from '@tanstack/react-router'
import { AccountBusiness, KeyofAccountBusiness, isAccountBusiness } from '@/api/Account'
import i18n, { KnownLanguages, Language } from '@/i18n'
import rootRoute from '@/routes/Root/route'
import { ensureAccountsQueryData, ensureSelectedAccountUidQueryData } from './contexts/Account/query'
import { prefetchGachaStatsQuery } from './contexts/Stats/query'
import GachaPage from './page'

const gachaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/Gacha/$keyofAccountBusiness',
  shouldReload: false,
  component: GachaPage,
  pendingComponent: Spinner,
  async loader (ctx) {
    console.debug(
      `%c===== GachaPage route loader =====: %c${ctx.params.keyofAccountBusiness}`,
      'color:white; background-color:orange; font-weight: bold;',
      'color:green; background-color:orange; font-weight: bold;',
    )

    const keyof = ctx.params.keyofAccountBusiness as KeyofAccountBusiness
    const business: AccountBusiness | undefined = AccountBusiness[keyof]
    if (!isAccountBusiness(business)) {
      throw new Error(`Invalid pathname gacha business: ${keyof}`)
    }

    // Preload query data
    console.debug('Preload query data...')
    await ensureAccountsQueryData(keyof)
    const selectedAccountUid = await ensureSelectedAccountUidQueryData(keyof)
    await prefetchGachaStatsQuery({
      business,
      uid: selectedAccountUid,
      customLocale: KnownLanguages[i18n.language as Language]
        .constants
        .gacha,
    })
    //

    return {
      business,
    }
  },
})

export default gachaRoute
