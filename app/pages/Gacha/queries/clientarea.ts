import { queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { KeyValuePairCommands } from '@/api/schemas/KeyValuePair'
import { Clientarea, Clientareas } from '@/pages/Gacha/contexts/Clientarea'
import queryClient from '@/queryClient'

const ClientareaInitialQueryKey = ['Clientarea.Initial'] as const
type ClientareaInitialQueryKey = typeof ClientareaInitialQueryKey

const DatabaseKey = 'Query:GachaClientareaTab' // For v1.2 before
const DefaultClientarea: Clientarea = Clientarea.Overview

function clientareaInitialQueryOptions () {
  return queryOptions<
    Clientarea,
    Error,
    Clientarea,
    ClientareaInitialQueryKey
  >({
    staleTime: Infinity,
    queryKey: ClientareaInitialQueryKey,
    queryFn: async function clientareaInitialQueryFn () {
      const kv = await KeyValuePairCommands.find({ key: DatabaseKey })
      if (!kv) {
        return DefaultClientarea
      }

      const initial = kv.val as Clientarea
      if (!Clientareas.includes(initial)) {
        console.error(`Unexpected Clientarea initial value: ${kv.val}`)
        await KeyValuePairCommands.delete({ key: DatabaseKey })
        return DefaultClientarea
      }

      return initial
    },
  })
}

export function useClientareaInitialSuspenseQuery () {
  return useSuspenseQuery(clientareaInitialQueryOptions())
}

export function ensureClientareaInitialQueryData () {
  return queryClient.ensureQueryData(clientareaInitialQueryOptions())
}

export function invalidateClientareaInitialQuery () {
  return queryClient.invalidateQueries({
    queryKey: ClientareaInitialQueryKey,
  })
}

const UpdateClientareaInitialMutationKey = [...ClientareaInitialQueryKey, 'Update'] as const

export function useClientareaInitialMutation () {
  return useMutation<Clientarea, Error, Clientarea>({
    mutationKey: UpdateClientareaInitialMutationKey,
    async mutationFn (newVal) {
      await KeyValuePairCommands.upsert({ key: DatabaseKey, val: newVal })
      return newVal
    },
    onSuccess () {
      invalidateClientareaInitialQuery()
    },
  })
}
