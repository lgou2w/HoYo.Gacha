import { mutationOptions, queryOptions, useMutation, useSuspenseQuery } from '@tanstack/react-query'
import queryClient from '@/queryClient'

// #region: Use Classic

const UseClassicQueryKey = ['Analysis.UseClassic'] as const
type UseClassicQueryKey = typeof UseClassicQueryKey

const KeyUseClassic = 'HG_ANALYSIS_USE_LEGACY'

function useClassicQueryOptions () {
  return queryOptions<
    boolean,
    Error,
    boolean,
    UseClassicQueryKey
  >({
    staleTime: Infinity,
    queryKey: UseClassicQueryKey,
    queryFn: function useClassicQueryFn () {
      const flag = localStorage.getItem(KeyUseClassic)

      // Disabled by default; therefore, it is only enabled when set to `true`.
      return flag === 'true'
    },
  })
}

export function useClassicSuspenseQuery () {
  return useSuspenseQuery(useClassicQueryOptions())
}

function useClassicMutationOptions () {
  return mutationOptions<
    boolean,
    Error,
    boolean,
    { previous: boolean | undefined }
  >({
    mutationKey: [...UseClassicQueryKey, 'Update'],
    async mutationFn (newVal) {
      localStorage.setItem(KeyUseClassic, String(newVal))
      return newVal
    },
    async onMutate (newVal) {
      await queryClient.cancelQueries({ queryKey: UseClassicQueryKey })
      const previous = queryClient.getQueryData<boolean>(UseClassicQueryKey)
      queryClient.setQueryData<boolean>(UseClassicQueryKey, newVal)
      return { previous }
    },
    onError (_error, _variables, onMutateResult) {
      if (onMutateResult?.previous !== undefined) {
        queryClient.setQueryData<boolean>(
          UseClassicQueryKey,
          onMutateResult.previous,
        )
      }
    },
    onSettled () {
      return queryClient.invalidateQueries({
        queryKey: UseClassicQueryKey,
      })
    },
  })
}

export function useClassicMutation () {
  return useMutation(useClassicMutationOptions())
}

// #endregion

// #region: Version Label

const VersionLabelQueryKey = ['Analysis.VersionLabel'] as const
type VersionLabelQueryKey = typeof VersionLabelQueryKey

const KeyVersionLabel = 'HG_ANALYSIS_VERSION_LABEL'

function useVersionLabelOptions () {
  return queryOptions<
    boolean,
    Error,
    boolean,
    VersionLabelQueryKey
  >({
    staleTime: Infinity,
    queryKey: VersionLabelQueryKey,
    queryFn: function useVersionLabelQueryFn () {
      const flag = localStorage.getItem(KeyVersionLabel)

      // HACK: It is enabled by default, so both true and undefined are enabled.
      return !flag || flag === 'true'
    },
  })
}

export function useVersionLabelSuspenseQuery () {
  return useSuspenseQuery(useVersionLabelOptions())
}

function useVersionLabelMutationOptions () {
  return mutationOptions<
    boolean,
    Error,
    boolean,
    { previous: boolean | undefined }
  >({
    mutationKey: [...VersionLabelQueryKey, 'Update'],
    async mutationFn (newVal) {
      localStorage.setItem(KeyVersionLabel, String(newVal))
      return newVal
    },
    async onMutate (newVal) {
      await queryClient.cancelQueries({ queryKey: VersionLabelQueryKey })
      const previous = queryClient.getQueryData<boolean>(VersionLabelQueryKey)
      queryClient.setQueryData<boolean>(VersionLabelQueryKey, newVal)
      return { previous }
    },
    onError (_error, _variables, onMutateResult) {
      if (onMutateResult?.previous !== undefined) {
        queryClient.setQueryData<boolean>(
          VersionLabelQueryKey,
          onMutateResult.previous,
        )
      }
    },
    onSettled () {
      return queryClient.invalidateQueries({
        queryKey: VersionLabelQueryKey,
      })
    },
  })
}

export function useVersionLabelMutation () {
  return useMutation(useVersionLabelMutationOptions())
}

// #endregion
