import { queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import queryClient from '@/queryClient'

const AnalysisVersionLabelQueryKey = ['Analysis.VersionLabel'] as const
type AnalysisVersionLabelQueryKey = typeof AnalysisVersionLabelQueryKey

const KeyAnalysisVersionLabel = 'HG_ANALYSIS_VERSION_LABEL'

function analysisVersionLabelQueryOptions () {
  return queryOptions<
    boolean,
    Error,
    boolean,
    AnalysisVersionLabelQueryKey
  >({
    staleTime: Infinity,
    queryKey: AnalysisVersionLabelQueryKey,
    queryFn: async function analysisVersionLabelQueryFn () {
      const flag = localStorage.getItem(KeyAnalysisVersionLabel)

      // HACK: It is enabled by default, so both true and undefined are enabled.
      return !flag || flag === 'true'
    },
  })
}

export function useAnalysisVersionLabelSuspenseQuery () {
  return useSuspenseQuery(analysisVersionLabelQueryOptions())
}

export function invalidateAnalysisVersionLabelQuery () {
  return queryClient.invalidateQueries({
    queryKey: AnalysisVersionLabelQueryKey,
  })
}

const UpdateAnalysisVersionLabelMutationKey = [...AnalysisVersionLabelQueryKey, 'Update'] as const

export function useAnalysisVersionLabelMutation () {
  return useMutation<
    boolean,
    Error,
    boolean
  >({
    mutationKey: UpdateAnalysisVersionLabelMutationKey,
    async mutationFn (newVal) {
      const oldVal = queryClient.getQueryData<boolean>(AnalysisVersionLabelQueryKey)
      if (oldVal === newVal) {
        return oldVal
      }

      localStorage.setItem(KeyAnalysisVersionLabel, String(newVal))
      return newVal
    },
    onSuccess () {
      invalidateAnalysisVersionLabelQuery()
    },
  })
}
