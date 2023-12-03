import { FetchQueryOptions, useQuery, useMutation, UseMutationOptions } from '@tanstack/react-query'
import { produce } from 'immer'
import { Account } from '@/api/interfaces/account'
import { OmitParametersFirst, PickParametersFirst } from '@/api/interfaces/declares'
import { DatabasePlugin, DatabaseError } from '@/api/plugins'
import { queryClient } from '@/api/store'

const AccountsQueryKey: FetchQueryOptions['queryKey'] = ['accounts']
const AccountsQueryOptions: FetchQueryOptions<Account[]> = {
  queryKey: AccountsQueryKey,
  queryFn: () => DatabasePlugin.findAccounts(),
  gcTime: Infinity
}

export function getAccountsQueryData () {
  return queryClient.getQueryData<Account[]>(AccountsQueryKey)
}

export function setAccountsQueryData (...rest: OmitParametersFirst<typeof queryClient.setQueryData<Account[]>>) {
  return queryClient.setQueryData<Account[]>(AccountsQueryKey, ...rest)
}

export function fetchAccountsQuery () {
  return queryClient.fetchQuery(AccountsQueryOptions)
}

export function getAccountsQueryDataOrFetch () {
  const cache = getAccountsQueryData()
  return cache
    ? Promise.resolve(cache)
    : fetchAccountsQuery()
}

export function useAccountsQuery () {
  return useQuery({
    ...AccountsQueryOptions,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })
}

const CreateAccountMutationKey: UseMutationOptions['mutationKey'] = ['accounts', 'create']
const CreateAccountMutationOptions: UseMutationOptions<
  Account,
  DatabaseError | Error,
  PickParametersFirst<typeof DatabasePlugin.createAccount>
> = {
  mutationKey: CreateAccountMutationKey,
  mutationFn: DatabasePlugin.createAccount,
  onSuccess (data) {
    if (!data) return
    setAccountsQueryData((prev) => {
      return prev && produce(prev, (draft) => {
        draft.push(data)
      })
    })
  }
}

export function useCreateAccountMutation () {
  return useMutation(CreateAccountMutationOptions)
}

const DeleteAccountMutationKey: UseMutationOptions['mutationKey'] = ['accounts', 'delete']
const DeleteAccountMutationOptions: UseMutationOptions<
  Account | null,
  DatabaseError | Error,
  PickParametersFirst<typeof DatabasePlugin.deleteAccount>
> = {
  mutationKey: DeleteAccountMutationKey,
  mutationFn: DatabasePlugin.deleteAccount,
  onSuccess (data) {
    if (!data) return
    setAccountsQueryData((prev) => {
      return prev && produce(prev, (draft) => {
        const idx = draft.findIndex((v) => v.id === data.id)
        if (idx !== -1) {
          draft.splice(idx, 1)
        }
      })
    })
  }
}

export function useDeleteAccountMutation () {
  return useMutation(DeleteAccountMutationOptions)
}

const UpdateAccountGameDataDirAndPropertiesMutationKey: UseMutationOptions['mutationKey'] =
  ['accounts', 'updateGameDataDirAndProperties']
const UpdateAccountGameDataDirAndPropertiesMutation: UseMutationOptions<
  Account | null,
  DatabaseError | Error,
  PickParametersFirst<typeof DatabasePlugin.updateAccountGameDataDirAndProperties>
> = {
  mutationKey: UpdateAccountGameDataDirAndPropertiesMutationKey,
  mutationFn: DatabasePlugin.updateAccountGameDataDirAndProperties,
  onSuccess (data) {
    if (!data) return
    setAccountsQueryData((prev) => {
      return prev && produce(prev, (draft) => {
        const ref = draft.find((v) => v.id === data.id)
        if (ref) {
          ref.gameDataDir = data.gameDataDir
          ref.properties = data.properties
        }
      })
    })
  }
}

export function useUpdateAccountGameDataDirAndPropertiesMutation () {
  return useMutation(UpdateAccountGameDataDirAndPropertiesMutation)
}
