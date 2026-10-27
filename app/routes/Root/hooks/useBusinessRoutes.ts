import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { AccountBusiness, AccountBusinessKeys, isAccountBusiness } from '@/api/Account'
import { createKValueStore } from '@/api/KValue'
import BusinessImages from '@/assets/images/BusinessImages'
import { ensureBusinessVisibilityQueryData } from '@/routes/Root/hooks/useBusinessVisibility'

export const BusinessRoutes = AccountBusinessKeys
  .map((keyof) => ({
    keyof,
    business: AccountBusiness[keyof],
    pathname: `/Gacha/${keyof}`,
    icon: BusinessImages[keyof].Icon!,
  }))

export type BusinessRoute = typeof BusinessRoutes[number]

// #region: Memory route

const MemoryRouteStore = createKValueStore({
  database: 'Query:MemoryBusinessRoute', // For v1.2 and earlier
  localStorage: 'HG_BUSINESS_MEMORY_ROUTE',
})

// Returns the remembered business, or null if none / invalid.
async function readMemoryRoute (): Promise<AccountBusiness | null> {
  const dirty = await MemoryRouteStore.read()
  if (!dirty) {
    return null
  }

  const business = +dirty
  return isAccountBusiness(business)
    ? business
    : null
}

// Serialize writes so that rapid A → B navigation always ends with B persisted.
let writeChain: Promise<void> = Promise.resolve()
async function writeMemoryRoute (business: AccountBusiness): Promise<void> {
  console.debug('Writing memory route:', AccountBusiness[business])
  writeChain = writeChain
    .then(() => MemoryRouteStore.write(String(business)))
    .catch((err) => console.error('Failed to write memory route:', err))
}

// This listener is responsible for writing the memory route when navigating to a business route
export function useRememberLastBusinessRoute () {
  const { subscribe } = useRouter()

  useEffect(() => {
    return subscribe('onBeforeLoad', (event) => {
      // Only react to actual path changes; first navigation to a deep link is not remembered.
      if (!event.pathChanged) {
        return
      }

      const hit = BusinessRoutes.find((route) => route.pathname === event.toLocation.pathname)
      if (hit) {
        writeMemoryRoute(hit.business)
      }
    })
  }, [subscribe])
}

// Returns the pathname to redirect to on first launch, or null to stay on home.
export async function resolveBusinessRouteRedirect (): Promise<string | null> {
  const business = await readMemoryRoute()
  if (!isAccountBusiness(business)) {
    return null
  }

  const route = BusinessRoutes.find((route) => route.business === business)
  if (!route) {
    return null
  }

  const visibility = await ensureBusinessVisibilityQueryData()
  if (visibility[business] === false) {
    return null
  }

  return route.pathname
}

// #endregion
