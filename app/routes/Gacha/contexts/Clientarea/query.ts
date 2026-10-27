import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { createKValueStore } from '@/api/KValue'
import { DatabaseError } from '@/api/error'
import queryClient from '@/queryClient'
import { Clientarea, isClientarea } from './types'

const DefaultClientarea: Clientarea = Clientarea.Overview
const ClientareaStore = createKValueStore({
  database: 'Query:GachaClientareaTab', // For v1.2 before
  localStorage: 'HG_GACHA_CLIENTAREA',
})

const ClientareaPreferenceQueryKey = ['Clientarea.Preference'] as const
type ClientareaPreferenceQueryKey = typeof ClientareaPreferenceQueryKey

export function clientareaPreferenceQueryOptions () {
  return queryOptions<
    Clientarea,
    DatabaseError | Error,
    Clientarea,
    ClientareaPreferenceQueryKey
  >({
    staleTime: Infinity,
    queryKey: ClientareaPreferenceQueryKey,
    queryFn: async function clientareaPreferenceQueryFn () {
      const clientarea = await ClientareaStore.read()
      if (!clientarea) {
        return DefaultClientarea
      }

      if (!isClientarea(clientarea)) {
        console.error(`Unexpected Clientarea preference value: ${clientarea}`)
        try {
          await ClientareaStore.clear()
        } catch (err) {
          console.error('Failed to clean up invalid Clientarea value', err)
        }

        return DefaultClientarea
      } else {
        return clientarea
      }
    },
  })
}

const UpdateClientareaPreferenceMutationKey = [...ClientareaPreferenceQueryKey, 'Update'] as const

export function clientareaPreferenceMutationOptions () {
  return mutationOptions<
    Clientarea,
    DatabaseError | Error,
    Clientarea,
    { previous: Clientarea | undefined }
  >({
    mutationKey: UpdateClientareaPreferenceMutationKey,
    async mutationFn (newVal) {
      await ClientareaStore.write(newVal)
      return newVal
    },
    async onMutate (newVal) {
      await queryClient.cancelQueries({ queryKey: ClientareaPreferenceQueryKey })
      const previous = queryClient.getQueryData<Clientarea>(ClientareaPreferenceQueryKey)
      queryClient.setQueryData<Clientarea>(ClientareaPreferenceQueryKey, newVal)
      return { previous }
    },
    onError (_error, _variables, onMutateResult) {
      if (onMutateResult?.previous !== undefined) {
        queryClient.setQueryData<Clientarea>(
          ClientareaPreferenceQueryKey,
          onMutateResult.previous,
        )
      }
    },
    onSettled () {
      return queryClient.invalidateQueries({
        queryKey: ClientareaPreferenceQueryKey,
      })
    },
  })
}
