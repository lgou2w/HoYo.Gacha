import GachaLayout from './components/Layout'
import AccountProvider from './contexts/Account/Provider'
import BannerSortableProvider from './contexts/BannerSortable/Provider'
import BusinessProvider from './contexts/Business/Provider'
import ClientareaProvider from './contexts/Clientarea/Provider'
import GachaStatsProvider from './contexts/Stats/Provider'
import gachaRoute from './route'

/**
 * Root page for the Gacha route.
 *
 * Wraps `GachaLayout` in the provider tree required by every tab. The nesting
 * order is significant — each provider consumes context from its ancestors:
 *
 * ```text
 * BusinessProvider          (key={business})
 * └─ AccountProvider        (business)
 *    └─ GachaStatsProvider  (business + selected account + locale)
 *       └─ BannerSortableProvider (business)
 *          └─ ClientareaProvider  (active tab)
 *             └─ GachaLayout
 * ```
 *
 * Responsibilities:
 *
 * - **BusinessProvider** — resolves the current `AccountBusiness` from the
 *   route loader. Re-keyed on `business`, so switching business unmounts and
 *   remounts the entire subtree, resetting all local UI state (scroll
 *   positions, expanded dialogs, dnd registration, etc.).
 *
 * - **AccountProvider** — suspends on the account list and the selected uid.
 *   Exposes `accounts`, `selected`, `selectedUid` and keeps the selected uid
 *   in sync with the account list via a side effect.
 *
 * - **GachaStatsProvider** — suspends on the gacha statistics for the
 *   selected account, using the current locale. Exposes `GachaStats`, the
 *   render-ready summary computed by the backend.
 *
 * - **BannerSortableProvider** — persists the user's banner order and
 *   visibility preferences per business. Shared by every tab that renders a
 *   banner list (Overview grid, Analysis columns) so reordering or hiding a
 *   banner affects all of them consistently.
 *
 * - **ClientareaProvider** — tracks the active tab inside the gacha view and
 *   persists it across sessions.
 *
 * Suspense boundaries: `AccountProvider` and `GachaStatsProvider` both suspend
 * on data. The enclosing route (or a parent boundary) must provide a
 * `<Suspense>` fallback covering the whole tree.
 */
export default function GachaPage () {
  const { business } = gachaRoute.useLoaderData()

  return (
    <BusinessProvider key={business} value={business}>
      <AccountProvider business={business}>
        <GachaStatsProvider>
          <BannerSortableProvider>
            <ClientareaProvider>
              <GachaLayout />
            </ClientareaProvider>
          </BannerSortableProvider>
        </GachaStatsProvider>
      </AccountProvider>
    </BusinessProvider>
  )
}
