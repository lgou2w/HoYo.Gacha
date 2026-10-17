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

const ClientareaInitialQueryKey = ['Clientarea.Initial'] as const
type ClientareaInitialQueryKey = typeof ClientareaInitialQueryKey

export function clientareaInitialQueryOptions () {
  return queryOptions<
    Clientarea,
    DatabaseError | Error,
    Clientarea,
    ClientareaInitialQueryKey
  >({
    staleTime: Infinity,
    queryKey: ClientareaInitialQueryKey,
    queryFn: async function clientareaInitialQueryFn () {
      const clientarea = await ClientareaStore.read()
      if (!clientarea) {
        return DefaultClientarea
      }

      if (!isClientarea(clientarea)) {
        console.error(`Unexpected Clientarea initial value: ${clientarea}`)
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

const UpdateClientareaInitialMutationKey = [...ClientareaInitialQueryKey, 'Update'] as const

export function clientareaInitialMutationOptions () {
  return mutationOptions<
    Clientarea,
    DatabaseError | Error,
    Clientarea,
    { previous: Clientarea | undefined }
  >({
    mutationKey: UpdateClientareaInitialMutationKey,
    async mutationFn (newVal) {
      await ClientareaStore.write(newVal)
      return newVal
    },
    async onMutate (newVal) {
      await queryClient.cancelQueries({ queryKey: ClientareaInitialQueryKey })
      const previous = queryClient.getQueryData<Clientarea>(ClientareaInitialQueryKey)
      queryClient.setQueryData<Clientarea>(ClientareaInitialQueryKey, newVal)
      return { previous }
    },
    onError (_error, _variables, onMutateResult) {
      if (onMutateResult?.previous !== undefined) {
        queryClient.setQueryData<Clientarea>(
          ClientareaInitialQueryKey,
          onMutateResult.previous,
        )
      }
    },
    onSettled () {
      return queryClient.invalidateQueries({
        queryKey: ClientareaInitialQueryKey,
      })
    },
  })
}
