import { queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { produce } from 'immer'
import { AccountBusiness, AccountBusinessKeys } from '@/api/schemas/Account'
import { KeyValuePairCommands } from '@/api/schemas/KeyValuePair'
import queryClient from '@/queryClient'

const NavbarBusinessVisibleQueryKey = ['Navbar.BusinessVisible'] as const
type NavbarBusinessVisibleQueryKey = typeof NavbarBusinessVisibleQueryKey

const NavbarBusinessVisibleDatabaseKey = 'Query:NavbarBusinessVisible' // For v1.2 before

// true | null -> visible
// false       -> invisible
export type NavbarBusinessVisible = Record<AccountBusiness, boolean | null>
const DefaultNavbarBusinessVisible: NavbarBusinessVisible = {
  [AccountBusiness.GenshinImpact]: null,
  [AccountBusiness.MiliastraWonderland]: null,
  [AccountBusiness.HonkaiStarRail]: null,
  [AccountBusiness.ZenlessZoneZero]: null,
}

function navbarBusinessVisibleQueryOptions () {
  return queryOptions<
    NavbarBusinessVisible,
    Error,
    NavbarBusinessVisible,
    NavbarBusinessVisibleQueryKey
  >({
    staleTime: Infinity,
    queryKey: NavbarBusinessVisibleQueryKey,
    queryFn: async function navbarBusinessVisibleQueryFn () {
      const kv = await KeyValuePairCommands.find({ key: NavbarBusinessVisibleDatabaseKey })
      const data = Object.assign({}, DefaultNavbarBusinessVisible)
      if (!kv) {
        return data
      }

      let parsed: NavbarBusinessVisible
      try {
        parsed = JSON.parse(kv.val)
      } catch (error) {
        console.error('Failed to parse NavbarBusinessVisible for database:', error)
        await KeyValuePairCommands.delete({ key: NavbarBusinessVisibleDatabaseKey })
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

export function useNavbarBusinessVisibleSuspenseQuery () {
  return useSuspenseQuery(navbarBusinessVisibleQueryOptions())
}

export function ensureNavbarBusinessVisibleQueryData () {
  return queryClient.ensureQueryData(navbarBusinessVisibleQueryOptions())
}

export function invalidateNavbarBusinessVisibleQuery () {
  return queryClient.invalidateQueries({
    queryKey: NavbarBusinessVisibleQueryKey,
  })
}

const UpdateNavbarBusinessVisibleMutationKey = [...NavbarBusinessVisibleQueryKey, 'Update'] as const

export function useNavbarBusinessVisibleMutation () {
  return useMutation<
    NavbarBusinessVisible,
    Error,
    Partial<NavbarBusinessVisible>
  >({
    mutationKey: UpdateNavbarBusinessVisibleMutationKey,
    async mutationFn (newVal) {
      let visible = queryClient.getQueryData<NavbarBusinessVisible>(NavbarBusinessVisibleQueryKey)

      if (!visible) {
        visible = Object.assign({}, DefaultNavbarBusinessVisible)
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
        key: NavbarBusinessVisibleDatabaseKey,
        val: JSON.stringify(newVisible),
      })

      return newVisible
    },
    onSuccess () {
      invalidateNavbarBusinessVisibleQuery()
    },
  })
}
