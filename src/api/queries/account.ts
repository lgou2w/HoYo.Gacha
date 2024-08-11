import { queryOptions, useMutation } from '@tanstack/react-query'
import { produce } from 'immer'
import { CreateAccountArgs, SqlxDatabaseError, SqlxError, createAccount, findAccountsByBusiness } from '@/api/commands/database'
import { Account } from '@/interfaces/Account'
import { Businesses, KeyofBusinesses, ReversedBusinesses } from '@/interfaces/Business'
import { OmitParametersFirst } from '@/interfaces/Declare'
import queryClient from '@/queryClient'

type AccountsKey = [KeyofBusinesses, 'Accounts']
function accountsKey (keyofBusinesses: KeyofBusinesses): AccountsKey {
  return [keyofBusinesses, 'Accounts']
}

function setAccountsData (
  keyofBusinesses: KeyofBusinesses,
  ...rest: OmitParametersFirst<typeof queryClient.setQueryData<Account[], AccountsKey>>
) {
  return queryClient.setQueryData<Account[], AccountsKey>(
    accountsKey(keyofBusinesses),
    ...rest
  )
}

export function accountsQueryOptions (keyofBusinesses: KeyofBusinesses) {
  return queryOptions<
    Account[],
    SqlxError | SqlxDatabaseError | Error,
    Account[],
    AccountsKey
  >({
    staleTime: Infinity,
    queryKey: accountsKey(keyofBusinesses),
    queryFn: () => findAccountsByBusiness({
      business: Businesses[keyofBusinesses]
    })
  })
}

const CreateAccountKey = ['Accounts', 'Create']
export function useCreateAccountMutation () {
  return useMutation<
    Account,
    SqlxError | SqlxDatabaseError | Error,
    CreateAccountArgs
  >({
    mutationKey: CreateAccountKey,
    mutationFn: createAccount,
    onSuccess (data) {
      setAccountsData(
        ReversedBusinesses[data.business],
        (prev) => {
          return produce(prev, (draft) => {
            draft ||= []
            draft.push(data)
          })
        }
      )
    }
  })
}
