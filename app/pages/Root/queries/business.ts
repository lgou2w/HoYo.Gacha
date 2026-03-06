import { queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { produce } from 'immer'
import { AccountBusiness, AccountBusinessKeys, KeyofAccountBusiness, isValidAccountBusiness } from '@/api/schemas/Account'
import { KeyValuePairCommands } from '@/api/schemas/KeyValuePair'
import { combineGachaPathname } from '@/pages/Gacha/route'
import queryClient from '@/queryClient'

const NavbarVisibleQueryKey = ['Business.NavbarVisible'] as const
type NavbarVisibleQueryKey = typeof NavbarVisibleQueryKey

const NavbarVisibleDatabaseKey = 'Query:NavbarBusinessVisible' // For v1.2 before

// true | null -> visible
// false       -> invisible
export type BusinessNavbarVisible = Record<AccountBusiness, boolean | null>
const DefaultBusinessNavbarVisible: BusinessNavbarVisible = {
  [AccountBusiness.GenshinImpact]: null,
  [AccountBusiness.MiliastraWonderland]: null,
  [AccountBusiness.HonkaiStarRail]: null,
  [AccountBusiness.ZenlessZoneZero]: null,
}

function navbarVisibleQueryOptions () {
  return queryOptions<
    BusinessNavbarVisible,
    Error,
    BusinessNavbarVisible,
    NavbarVisibleQueryKey
  >({
    staleTime: Infinity,
    queryKey: NavbarVisibleQueryKey,
    queryFn: async function navbarVisibleQueryFn () {
      const kv = await KeyValuePairCommands.find({ key: NavbarVisibleDatabaseKey })
      const data = Object.assign({}, DefaultBusinessNavbarVisible)
      if (!kv) {
        return data
      }

      let parsed: BusinessNavbarVisible
      try {
        parsed = JSON.parse(kv.val)
      } catch (error) {
        console.error('Failed to parse BusinessNavbarVisible for database:', error)
        await KeyValuePairCommands.delete({ key: NavbarVisibleDatabaseKey })
        return data
      }

      for (const keyof of AccountBusinessKeys) {
        const business = AccountBusiness[keyof]
        const visible = parsed[business]
        if (typeof visible === 'boolean' || visible === null) {
          data[business] = visible
        }
      }

      return data
    },
  })
}

export function useNavbarVisibleSuspenseQuery () {
  return useSuspenseQuery(navbarVisibleQueryOptions())
}

export function ensureNavbarVisibleQueryData () {
  return queryClient.ensureQueryData(navbarVisibleQueryOptions())
}

export function invalidateNavbarVisibleQuery () {
  return queryClient.invalidateQueries({
    queryKey: NavbarVisibleQueryKey,
  })
}

const UpdateNavbarVisibleMutationKey = [...NavbarVisibleQueryKey, 'Update'] as const

export function useNavbarVisibleMutation () {
  return useMutation<
    BusinessNavbarVisible,
    Error,
    Partial<BusinessNavbarVisible>
  >({
    mutationKey: UpdateNavbarVisibleMutationKey,
    async mutationFn (newVal) {
      let visible = queryClient.getQueryData<BusinessNavbarVisible>(NavbarVisibleQueryKey)

      if (!visible) {
        visible = Object.assign({}, DefaultBusinessNavbarVisible)
      }

      const newVisible = produce(visible, (draft) => {
        for (const keyof of AccountBusinessKeys) {
          const business = AccountBusiness[keyof]
          const value = newVal[business]
          if (typeof value !== 'undefined' && draft[business] !== value) {
            draft[business] = value
          }
        }
      })

      await KeyValuePairCommands.upsert({
        key: NavbarVisibleDatabaseKey,
        val: JSON.stringify(newVisible),
      })

      return newVisible
    },
    onSuccess () {
      invalidateNavbarVisibleQuery()
    },
  })
}

const MemoryRouteSwitchQueryKey = ['Business.MemoryRouteSwitch'] as const
type MemoryRouteSwitchQueryKey = typeof MemoryRouteSwitchQueryKey

const MemoryRouteSwitchDatabaseKey = 'Query:MemoryBusinessRouteSwitch'
const MemoryRouteDatabaseKey = 'Query:MemoryBusinessRoute'

export async function readMemoryRoute (): Promise<AccountBusiness | undefined> {
  const kv = await KeyValuePairCommands.find({ key: MemoryRouteDatabaseKey })
  if (!kv) {
    return undefined
  }

  const business = +kv.val
  return isValidAccountBusiness(business)
    ? business
    : undefined
}

export async function writeMemoryRoute (business: AccountBusiness) {
  console.debug('Writing memory route:', AccountBusiness[business])
  await KeyValuePairCommands.upsert({
    key: MemoryRouteDatabaseKey,
    val: String(business),
  })
}

// The purpose of this cached setting is to cache route values if the switch is disabled.
// When it is re-enabled, data is written immediately if the cached setting is available,
// which can prevent data loss in some cases.
let lastMemoryRouteCached: AccountBusiness | undefined = undefined

export async function writeMemoryRouteIfEnabled (business: AccountBusiness) {
  const enabled = queryClient.getQueryData<boolean>(MemoryRouteSwitchQueryKey)

  // HACK: It is enabled by default, so both true and undefined are enabled.
  if (typeof enabled === 'undefined' || enabled === true) {
    await writeMemoryRoute(business)
  } else {
    // Cache the value when the switch is disabled
    lastMemoryRouteCached = business
    console.debug('Memory route switch is disabled, caching route:', AccountBusiness[business])
  }
}

function memoryRouteSwitchQueryOptions () {
  return queryOptions<
    boolean,
    Error,
    boolean,
    MemoryRouteSwitchQueryKey
  >({
    staleTime: Infinity,
    queryKey: MemoryRouteSwitchQueryKey,
    queryFn: async function memoryRouteQueryFn () {
      const kv = await KeyValuePairCommands.find({ key: MemoryRouteSwitchDatabaseKey })

      // HACK: It is enabled by default, so both true and undefined are enabled.
      return !kv || kv.val === 'true'
    },
  })
}

export function useMemoryRouteSwitchSuspenseQuery () {
  return useSuspenseQuery(memoryRouteSwitchQueryOptions())
}

export function ensureMemoryRouteSwitchQueryData () {
  return queryClient.ensureQueryData(memoryRouteSwitchQueryOptions())
}

export function invalidateMemoryRouteSwitchQuery () {
  return queryClient.invalidateQueries({
    queryKey: MemoryRouteSwitchQueryKey,
  })
}

const UpdateMemoryRouteSwitchMutationKey = [...MemoryRouteSwitchQueryKey, 'Update'] as const

export function useMemoryRouteSwitchMutation () {
  return useMutation<
    boolean,
    Error,
    boolean
  >({
    mutationKey: UpdateMemoryRouteSwitchMutationKey,
    async mutationFn (newVal) {
      const oldVal = queryClient.getQueryData<boolean>(MemoryRouteSwitchQueryKey)
      if (oldVal === newVal) {
        return oldVal
      }

      await KeyValuePairCommands.upsert({
        key: MemoryRouteSwitchDatabaseKey,
        val: String(newVal),
      })

      return newVal
    },
    onSuccess (newVal) {
      invalidateMemoryRouteSwitchQuery()

      // If the switch is enabled and there is a cached route, write it immediately
      if (newVal === true && lastMemoryRouteCached !== undefined) {
        console.debug('Memory route switch enabled, writing cached route:', AccountBusiness[lastMemoryRouteCached])
        writeMemoryRoute(lastMemoryRouteCached)
        lastMemoryRouteCached = undefined
      }
    },
  })
}

export async function resolveMemoryRouteRedirect (): Promise<string | undefined> {
  const memoryRoute = await ensureMemoryRouteSwitchQueryData()
  if (!memoryRoute) {
    return undefined
  }

  const business = await readMemoryRoute()
  if (!isValidAccountBusiness(business)) {
    return undefined
  }

  const visible = await ensureNavbarVisibleQueryData()
  if (visible[business] === false) {
    return undefined
  }

  // Redirect
  return combineGachaPathname(AccountBusiness[business] as KeyofAccountBusiness)
}
