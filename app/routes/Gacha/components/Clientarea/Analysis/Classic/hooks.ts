import { mutationOptions, queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import queryClient from '@/queryClient'
import { DefaultRecordsOrder, RecordsOrder, isRecordsOrder } from './types'

const KeyRecordsOrder = 'HG_ANALYSIS_RECORDS_ORDER'

const UseRecordsOrderQueryKey = ['Analysis.RecordsOrder'] as const
type UseRecordsOrderQueryKey = typeof UseRecordsOrderQueryKey

function useRecordsOrderQueryOptions () {
  return queryOptions<RecordsOrder, Error, RecordsOrder, UseRecordsOrderQueryKey>({
    staleTime: Infinity,
    queryKey: UseRecordsOrderQueryKey,
    queryFn: function useRecordsOrderQueryFn () {
      const val = localStorage.getItem(KeyRecordsOrder)
      return isRecordsOrder(val) ? val : DefaultRecordsOrder
    },
  })
}

export function useRecordsOrderSuspenseQuery () {
  return useSuspenseQuery(useRecordsOrderQueryOptions())
}

function useRecordsOrderMutationOptions () {
  return mutationOptions<
    RecordsOrder,
    Error,
    RecordsOrder,
    { previous: RecordsOrder | undefined }
  >({
    mutationKey: [...UseRecordsOrderQueryKey, 'Update'],
    async mutationFn (newVal) {
      localStorage.setItem(KeyRecordsOrder, newVal)
      return newVal
    },
    async onMutate (newVal) {
      await queryClient.cancelQueries({ queryKey: UseRecordsOrderQueryKey })
      const previous = queryClient.getQueryData<RecordsOrder>(UseRecordsOrderQueryKey)
      queryClient.setQueryData<RecordsOrder>(UseRecordsOrderQueryKey, newVal)
      return { previous }
    },
    onError (_error, _variables, onMutateResult) {
      if (onMutateResult?.previous !== undefined) {
        queryClient.setQueryData<RecordsOrder>(
          UseRecordsOrderQueryKey,
          onMutateResult.previous,
        )
      }
    },
    onSettled () {
      return queryClient.invalidateQueries({
        queryKey: UseRecordsOrderQueryKey,
      })
    },
  })
}

export function useRecordsOrderMutation () {
  return useMutation(useRecordsOrderMutationOptions())
}
