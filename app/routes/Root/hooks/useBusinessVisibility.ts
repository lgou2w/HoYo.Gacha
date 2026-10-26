import { mutationOptions, queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { produce } from 'immer'
import { AccountBusiness, AccountBusinessKeys } from '@/api/Account'
import { createKValueStore } from '@/api/KValue'
import { DatabaseError } from '@/api/error'
import queryClient from '@/queryClient'

// true | null -> visible
// false       -> invisible
export type BusinessVisibility = Record<AccountBusiness, boolean | null>
export const DefaultBusinessVisibility: BusinessVisibility = {
  [AccountBusiness.GenshinImpact]: null,
  [AccountBusiness.MiliastraWonderland]: null,
  [AccountBusiness.HonkaiStarRail]: null,
  [AccountBusiness.ZenlessZoneZero]: null,
}

const BusinessVisibilityStore = createKValueStore({
  database: 'Query:NavbarBusinessVisible', // For v1.2 before
  localStorage: 'HG_BUSINESS_VISIBILITY',
})

const BusinessVisibilityQueryKey = ['Business.Visibility'] as const
type BusinessVisibilityQueryKey = typeof BusinessVisibilityQueryKey

function businessVisibilityQueryOptions () {
  return queryOptions<
    BusinessVisibility,
    DatabaseError | Error,
    BusinessVisibility,
    BusinessVisibilityQueryKey
  >({
    staleTime: Infinity,
    queryKey: BusinessVisibilityQueryKey,
    queryFn: async function businessVisibilityQueryFn () {
      const dirty = await BusinessVisibilityStore.read()
      if (!dirty) {
        return DefaultBusinessVisibility
      }

      let visibility: BusinessVisibility
      try {
        visibility = JSON.parse(dirty)
      } catch (error) {
        console.error('Failed to parse business visibility:', error)
        await BusinessVisibilityStore.clear()
        return DefaultBusinessVisibility
      }

      return produce(DefaultBusinessVisibility, (draft) => {
        for (const keyof of AccountBusinessKeys) {
          const business = AccountBusiness[keyof]
          const visible = visibility[business]
          if (typeof visible === 'boolean' || visible === null) {
            draft[business] = visible
          }
        }
      })
    },
  })
}

export function useBusinessVisibilitySuspenseQuery () {
  return useSuspenseQuery(businessVisibilityQueryOptions())
}

export function ensureBusinessVisibilityQueryData () {
  return queryClient.query({
    ...businessVisibilityQueryOptions(),
    staleTime: 'static',
  })
}

const UpdateBusinessVisibilityMutationKey = [...BusinessVisibilityQueryKey, 'Update'] as const

function businessVisibilityMutationOptions () {
  return mutationOptions<
    BusinessVisibility,
    DatabaseError | Error,
    Partial<BusinessVisibility>,
    { previous: BusinessVisibility | undefined }
  >({
    mutationKey: UpdateBusinessVisibilityMutationKey,
    async mutationFn (newVal) {
      const current = queryClient.getQueryData<BusinessVisibility>(BusinessVisibilityQueryKey)
      const next = produce(current ?? DefaultBusinessVisibility, (draft) => {
        for (const keyof of AccountBusinessKeys) {
          const business = AccountBusiness[keyof]
          const visible = newVal[business]
          if (typeof visible === 'boolean' && draft[business] !== visible) {
            draft[business] = visible
          }
        }
      })

      await BusinessVisibilityStore.write(JSON.stringify(next))
      return next
    },
    onSuccess (data) {
      queryClient.setQueriesData<BusinessVisibility>(
        { queryKey: BusinessVisibilityQueryKey },
        data,
      )
    },
  })
}

export function useBusinessVisibilityMutation () {
  return useMutation(businessVisibilityMutationOptions())
}
