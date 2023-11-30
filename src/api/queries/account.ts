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
  Account | null,
  DatabaseError | Error,
  PickParametersFirst<typeof DatabasePlugin['createAccount']>
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
