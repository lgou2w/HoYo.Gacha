import { queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { produce } from 'immer'
import { AccountBusiness, AccountBusinessKeys } from '@/api/schemas/Account'
import { KeyValuePairCommands } from '@/api/schemas/KeyValuePair'
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
